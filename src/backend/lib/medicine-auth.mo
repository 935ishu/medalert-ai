import Types "../types/medicine-auth";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";

module {

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /// Lightweight password "hash" — simple polynomial hash using Nat arithmetic.
  /// Not cryptographic, sufficient for a demo prototype.
  public func hashPassword(password : Text) : Text {
    let prime : Nat = 16777619;
    let modulus : Nat = 4294967296; // 2^32
    var h : Nat = 2166136261;
    for (c in password.toIter()) {
      let code : Nat = Nat32.toNat(Char.toNat32(c));
      // FNV-1a style: mix via multiply (no XOR on Nat)
      h := (h + code * prime) % modulus;
    };
    h.toText();
  };

  /// Derive a deterministic-enough token from userId + current time.
  public func generateToken(userId : Types.UserId) : Types.SessionToken {
    let t = Time.now();
    userId # "_" # t.toText();
  };

  // ---------------------------------------------------------------------------
  // Auth domain
  // ---------------------------------------------------------------------------

  public func registerUser(
    users : List.List<Types.User>,
    username : Text,
    password : Text,
    role : Types.UserRole,
  ) : { #ok : Types.User; #err : Text } {
    // Check duplicate username
    switch (users.find(func(u : Types.User) : Bool { u.username == username })) {
      case (?_) { return #err("Username already taken") };
      case null {};
    };
    let newUser : Types.User = {
      id = username; // use username as stable id for simplicity
      username;
      passwordHash = hashPassword(password);
      role;
      createdAt = Time.now();
    };
    users.add(newUser);
    #ok(newUser);
  };

  public func authenticateUser(
    users : List.List<Types.User>,
    username : Text,
    password : Text,
  ) : { #ok : Types.User; #err : Text } {
    switch (users.find(func(u : Types.User) : Bool { u.username == username })) {
      case null { #err("Invalid username or password") };
      case (?u) {
        if (u.passwordHash == hashPassword(password)) {
          #ok(u);
        } else {
          #err("Invalid username or password");
        };
      };
    };
  };

  public func createSession(
    sessions : Map.Map<Types.SessionToken, Types.Session>,
    userId : Types.UserId,
  ) : Types.Session {
    let token = generateToken(userId);
    // Sessions valid for 30 days in nanoseconds
    let thirtyDays : Int = 30 * 24 * 60 * 60 * 1_000_000_000;
    let session : Types.Session = {
      token;
      userId;
      expiresAt = Time.now() + thirtyDays;
    };
    sessions.add(token, session);
    session;
  };

  public func validateSession(
    sessions : Map.Map<Types.SessionToken, Types.Session>,
    token : Types.SessionToken,
  ) : ?Types.Session {
    switch (sessions.get(token)) {
      case null null;
      case (?s) {
        if (s.expiresAt > Time.now()) { ?s } else {
          sessions.remove(token);
          null;
        };
      };
    };
  };

  public func invalidateSession(
    sessions : Map.Map<Types.SessionToken, Types.Session>,
    token : Types.SessionToken,
  ) : () {
    sessions.remove(token);
  };

  public func getUserById(
    users : List.List<Types.User>,
    userId : Types.UserId,
  ) : ?Types.User {
    users.find(func(u : Types.User) : Bool { u.id == userId });
  };

  // ---------------------------------------------------------------------------
  // Medicine domain
  // ---------------------------------------------------------------------------

  /// Parse ISO date string "YYYY-MM-DD" into (year, month, day) tuple.
  /// Returns null on invalid format.
  func parseDate(date : Text) : ?(Nat, Nat, Nat) {
    let parts = date.split(#char '-').toArray();
    if (parts.size() != 3) return null;
    switch (Nat.fromText(parts[0]), Nat.fromText(parts[1]), Nat.fromText(parts[2])) {
      case (?y, ?m, ?d) { ?(y, m, d) };
      case _ null;
    };
  };

  /// Compare two ISO dates as strings. Returns #less / #equal / #greater.
  func compareDates(a : Text, b : Text) : { #less; #equal; #greater } {
    // Lexicographic comparison works for YYYY-MM-DD format
    if (a < b) #less else if (a == b) #equal else #greater;
  };

  /// Return today's date as "YYYY-MM-DD" string derived from Time.now().
  func todayISO() : Text {
    // Time.now() is nanoseconds since Unix epoch
    let secondsNow : Int = Time.now() / 1_000_000_000;
    let days : Int = secondsNow / 86400; // days since epoch

    // Gregorian calendar computation
    let z : Int = days + 719468;
    let era : Int = (if (z >= 0) z else z - 146096) / 146097;
    let doe : Int = z - era * 146097;
    let yoe : Int = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y : Int = yoe + era * 400;
    let doy : Int = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp : Int = (5 * doy + 2) / 153;
    let d : Int = doy - (153 * mp + 2) / 5 + 1;
    let m : Int = if (mp < 10) mp + 3 else mp - 9;
    let finalY : Int = if (m <= 2) y + 1 else y;

    let yStr = finalY.toText();
    let mStr = if (m < 10) "0" # m.toText() else m.toText();
    let dStr = if (d < 10) "0" # d.toText() else d.toText();
    yStr # "-" # mStr # "-" # dStr;
  };

  /// Compute medicine status relative to today.
  public func computeStatus(expiryDate : Text) : Types.MedicineStatus {
    let today = todayISO();
    switch (compareDates(expiryDate, today)) {
      case (#less) { #expired };
      case (#equal) { #expired };
      case (#greater) {
        // Check if within 7 days
        switch (parseDate(expiryDate), parseDate(today)) {
          case (?(ey, em, ed), ?(ty, tm, td)) {
            let jdExpiry : Int = julianDay(ey, em, ed);
            let jdToday : Int = julianDay(ty, tm, td);
            let diff = jdExpiry - jdToday;
            if (diff <= 7) #nearExpiry else #safe;
          };
          case _ #safe; // fallback
        };
      };
    };
  };

  /// Julian Day Number for Gregorian date — used for day-difference arithmetic.
  func julianDay(y : Nat, m : Nat, d : Nat) : Int {
    let yi : Int = y.toInt();
    let mi : Int = m.toInt();
    let di : Int = d.toInt();
    let a : Int = (14 - mi) / 12;
    let yr : Int = yi + 4800 - a;
    let mo : Int = mi + 12 * a - 3;
    di + (153 * mo + 2) / 5 + 365 * yr + yr / 4 - yr / 100 + yr / 400 - 32045;
  };

  public func addMedicine(
    medicines : List.List<Types.Medicine>,
    nextId : Nat,
    userId : Types.UserId,
    req : Types.AddMedicineRequest,
  ) : Types.Medicine {
    let now = Time.now();
    let med : Types.Medicine = {
      id = nextId;
      userId;
      name = req.name;
      expiryDate = req.expiryDate;
      batchNumber = req.batchNumber;
      manufacturer = req.manufacturer;
      notes = req.notes;
      createdAt = now;
      updatedAt = now;
    };
    medicines.add(med);
    med;
  };

  public func updateMedicine(
    medicines : List.List<Types.Medicine>,
    userId : Types.UserId,
    role : Types.UserRole,
    req : Types.UpdateMedicineRequest,
  ) : { #ok : Types.Medicine; #err : Text } {
    var found = false;
    var result : ?Types.Medicine = null;
    medicines.mapInPlace(func(m : Types.Medicine) : Types.Medicine {
      if (m.id == req.id) {
        // Check ownership
        if (m.userId == userId or role == #admin) {
          let updated : Types.Medicine = {
            m with
            name = req.name;
            expiryDate = req.expiryDate;
            batchNumber = req.batchNumber;
            manufacturer = req.manufacturer;
            notes = req.notes;
            updatedAt = Time.now();
          };
          found := true;
          result := ?updated;
          updated;
        } else {
          found := true; // found but unauthorized
          m;
        };
      } else {
        m;
      };
    });
    switch (result) {
      case (?med) { #ok(med) };
      case null {
        if (found) { #err("Unauthorized") } else { #err("Medicine not found") };
      };
    };
  };

  public func deleteMedicine(
    medicines : List.List<Types.Medicine>,
    userId : Types.UserId,
    role : Types.UserRole,
    medicineId : Nat,
  ) : { #ok; #err : Text } {
    switch (medicines.findIndex(func(m : Types.Medicine) : Bool { m.id == medicineId })) {
      case null { #err("Medicine not found") };
      case (?idx) {
        let m = medicines.at(idx);
        if (m.userId != userId and role != #admin) {
          return #err("Unauthorized");
        };
        // Remove by rebuilding without the target
        let filtered = medicines.filter(func(med : Types.Medicine) : Bool { med.id != medicineId });
        medicines.clear();
        medicines.append(filtered);
        #ok;
      };
    };
  };

  public func getMedicineById(
    medicines : List.List<Types.Medicine>,
    userId : Types.UserId,
    role : Types.UserRole,
    medicineId : Nat,
  ) : ?Types.Medicine {
    switch (medicines.find(func(m : Types.Medicine) : Bool { m.id == medicineId })) {
      case null null;
      case (?m) {
        if (m.userId == userId or role == #admin) { ?m } else null;
      };
    };
  };

  public func getMedicinesForUser(
    medicines : List.List<Types.Medicine>,
    userId : Types.UserId,
    role : Types.UserRole,
  ) : [Types.Medicine] {
    if (role == #admin) {
      medicines.toArray();
    } else {
      medicines.filter(func(m : Types.Medicine) : Bool { m.userId == userId }).toArray();
    };
  };

  public func searchMedicinesByName(
    medicines : List.List<Types.Medicine>,
    userId : Types.UserId,
    role : Types.UserRole,
    searchTerm : Text,
  ) : [Types.Medicine] {
    let lowerTerm = searchTerm.toLower();
    let scope : List.List<Types.Medicine> = if (role == #admin) {
      medicines;
    } else {
      medicines.filter(func(m : Types.Medicine) : Bool { m.userId == userId });
    };
    scope.filter(func(m : Types.Medicine) : Bool {
      m.name.toLower().contains(#text lowerTerm);
    }).toArray();
  };

  public func filterMedicinesByStatus(
    medicines : List.List<Types.Medicine>,
    userId : Types.UserId,
    role : Types.UserRole,
    status : Types.MedicineStatus,
  ) : [Types.Medicine] {
    let scope : List.List<Types.Medicine> = if (role == #admin) {
      medicines;
    } else {
      medicines.filter(func(m : Types.Medicine) : Bool { m.userId == userId });
    };
    scope.filter(func(m : Types.Medicine) : Bool {
      computeStatus(m.expiryDate) == status;
    }).toArray();
  };

  // ---------------------------------------------------------------------------
  // Seed data
  // ---------------------------------------------------------------------------

  public func seedSampleMedicines(
    medicines : List.List<Types.Medicine>,
    nextId : Nat,
    demoUserId : Types.UserId,
  ) : Nat {
    // today approximated as "2026-04-10" (matches deployment date)
    let samples : [(Text, Text, Text, Text, Text)] = [
      // (name, expiryDate, batchNumber, manufacturer, notes)
      ("Paracetamol 500mg", "2027-06-15", "PARA-001", "Sun Pharma", "Fever and pain relief"),
      ("Amoxicillin 250mg", "2026-12-31", "AMOX-202", "Cipla Ltd", "Antibiotic — complete full course"),
      ("Metformin 500mg", "2028-03-20", "MET-501", "Dr. Reddys", "Diabetes management"),
      ("Atorvastatin 10mg", "2026-04-15", "ATOR-100", "Pfizer India", "Cholesterol control"),
      ("Cetirizine 10mg", "2026-04-14", "CET-301", "Mankind Pharma", "Antihistamine for allergies"),
      ("Omeprazole 20mg", "2025-11-30", "OMP-210", "Lupin Ltd", "Acid reflux — expired"),
      ("Azithromycin 500mg", "2025-08-01", "AZI-050", "Abbott India", "Z-pack antibiotic — expired"),
      ("Vitamin D3 60000IU", "2027-09-10", "VD3-060", "Himalaya Wellness", "Weekly supplement"),
      ("Ibuprofen 400mg", "2026-04-17", "IBU-400", "Torrent Pharma", "Anti-inflammatory"),
      ("Pantoprazole 40mg", "2026-01-05", "PAN-040", "Zydus Cadila", "PPI — expired"),
    ];

    var id = nextId;
    let baseTime : Int = 1_744_000_000_000_000_000; // ~2026-04-07
    for ((name, expiry, batch, mfr, notes) in samples.vals()) {
      let med : Types.Medicine = {
        id;
        userId = demoUserId;
        name;
        expiryDate = expiry;
        batchNumber = batch;
        manufacturer = mfr;
        notes;
        createdAt = baseTime;
        updatedAt = baseTime;
      };
      medicines.add(med);
      id += 1;
    };
    id; // return next available id
  };
};

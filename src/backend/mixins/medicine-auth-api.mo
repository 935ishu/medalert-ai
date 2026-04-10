import Types "../types/medicine-auth";
import Lib "../lib/medicine-auth";
import List "mo:core/List";
import Map "mo:core/Map";
import Int "mo:core/Int";

mixin (
  users : List.List<Types.User>,
  sessions : Map.Map<Types.SessionToken, Types.Session>,
  medicines : List.List<Types.Medicine>,
  state : Types.State,
) {

  // -------------------------------------------------------------------------
  // Internal helpers
  // -------------------------------------------------------------------------

  func initOnce() {
    if (state.initialized) return;
    state.initialized := true;

    // Create admin user
    switch (Lib.registerUser(users, "admin", "admin123", #admin)) {
      case (#ok(_)) {};
      case (#err(_)) {};
    };

    // Seed sample medicines
    state.nextMedicineId := Lib.seedSampleMedicines(medicines, state.nextMedicineId, "admin");
  };

  func resolveUser(token : Types.SessionToken) : ?Types.User {
    switch (Lib.validateSession(sessions, token)) {
      case null null;
      case (?session) { Lib.getUserById(users, session.userId) };
    };
  };

  // -------------------------------------------------------------------------
  // Auth endpoints
  // -------------------------------------------------------------------------

  public func register(username : Text, password : Text) : async Types.AuthResult {
    initOnce();
    switch (Lib.registerUser(users, username, password, #user)) {
      case (#err(msg)) { #err(msg) };
      case (#ok(user)) {
        let session = Lib.createSession(sessions, user.id);
        let info : Types.UserInfo = { id = user.id; username = user.username; role = user.role };
        #ok({ token = session.token; user = info });
      };
    };
  };

  public func login(username : Text, password : Text) : async Types.AuthResult {
    initOnce();
    switch (Lib.authenticateUser(users, username, password)) {
      case (#err(msg)) { #err(msg) };
      case (#ok(user)) {
        let session = Lib.createSession(sessions, user.id);
        let info : Types.UserInfo = { id = user.id; username = user.username; role = user.role };
        #ok({ token = session.token; user = info });
      };
    };
  };

  public func logout(token : Types.SessionToken) : async () {
    Lib.invalidateSession(sessions, token);
  };

  public func whoAmI(token : Types.SessionToken) : async ?Types.UserInfo {
    initOnce();
    switch (resolveUser(token)) {
      case null null;
      case (?u) { ?{ id = u.id; username = u.username; role = u.role } };
    };
  };

  // -------------------------------------------------------------------------
  // Medicine endpoints
  // -------------------------------------------------------------------------

  public func addMedicine(token : Types.SessionToken, req : Types.AddMedicineRequest) : async Types.MedicineResult {
    initOnce();
    switch (resolveUser(token)) {
      case null { #err("Unauthorized") };
      case (?user) {
        let med = Lib.addMedicine(medicines, state.nextMedicineId, user.id, req);
        state.nextMedicineId += 1;
        #ok(med);
      };
    };
  };

  public func updateMedicine(token : Types.SessionToken, req : Types.UpdateMedicineRequest) : async Types.MedicineResult {
    initOnce();
    switch (resolveUser(token)) {
      case null { #err("Unauthorized") };
      case (?user) { Lib.updateMedicine(medicines, user.id, user.role, req) };
    };
  };

  public func deleteMedicine(token : Types.SessionToken, id : Nat) : async { #ok; #err : Text } {
    initOnce();
    switch (resolveUser(token)) {
      case null { #err("Unauthorized") };
      case (?user) { Lib.deleteMedicine(medicines, user.id, user.role, id) };
    };
  };

  public func getMedicine(token : Types.SessionToken, id : Nat) : async ?Types.Medicine {
    initOnce();
    switch (resolveUser(token)) {
      case null null;
      case (?user) { Lib.getMedicineById(medicines, user.id, user.role, id) };
    };
  };

  public func getMedicines(token : Types.SessionToken) : async Types.MedicinesResult {
    initOnce();
    switch (resolveUser(token)) {
      case null { #err("Unauthorized") };
      case (?user) { #ok(Lib.getMedicinesForUser(medicines, user.id, user.role)) };
    };
  };

  public func searchMedicines(token : Types.SessionToken, term : Text) : async Types.MedicinesResult {
    initOnce();
    switch (resolveUser(token)) {
      case null { #err("Unauthorized") };
      case (?user) { #ok(Lib.searchMedicinesByName(medicines, user.id, user.role, term)) };
    };
  };

  public func filterByStatus(token : Types.SessionToken, status : Text) : async Types.MedicinesResult {
    initOnce();
    switch (resolveUser(token)) {
      case null { #err("Unauthorized") };
      case (?user) {
        let medStatus : Types.MedicineStatus = switch (status) {
          case "expired" { #expired };
          case "nearExpiry" { #nearExpiry };
          case _ { #safe };
        };
        #ok(Lib.filterMedicinesByStatus(medicines, user.id, user.role, medStatus));
      };
    };
  };

  public func getDashboardStats(token : Types.SessionToken) : async { total : Nat; expired : Nat; nearExpiry : Nat; safe : Nat } {
    initOnce();
    switch (resolveUser(token)) {
      case null { { total = 0; expired = 0; nearExpiry = 0; safe = 0 } };
      case (?user) {
        let all = Lib.getMedicinesForUser(medicines, user.id, user.role);
        var expired = 0;
        var near = 0;
        var safe = 0;
        for (m in all.vals()) {
          switch (Lib.computeStatus(m.expiryDate)) {
            case (#expired) { expired += 1 };
            case (#nearExpiry) { near += 1 };
            case (#safe) { safe += 1 };
          };
        };
        { total = all.size(); expired; nearExpiry = near; safe };
      };
    };
  };

  public func getRecentActivity(token : Types.SessionToken) : async [Types.Medicine] {
    initOnce();
    switch (resolveUser(token)) {
      case null { [] };
      case (?user) {
        let all = Lib.getMedicinesForUser(medicines, user.id, user.role);
        // Sort descending by updatedAt and take last 5
        let sorted = all.sort(func(a : Types.Medicine, b : Types.Medicine) : { #less; #equal; #greater } {
          Int.compare(b.updatedAt, a.updatedAt)
        });
        if (sorted.size() <= 5) {
          sorted;
        } else {
          sorted.sliceToArray(0, 5);
        };
      };
    };
  };
};

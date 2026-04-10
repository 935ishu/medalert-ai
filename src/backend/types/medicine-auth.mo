module {
  // --- Auth types ---
  public type UserId = Text;

  public type UserRole = {
    #admin;
    #user;
  };

  public type User = {
    id : UserId;
    username : Text;
    passwordHash : Text;
    role : UserRole;
    createdAt : Int;
  };

  public type SessionToken = Text;

  public type Session = {
    token : SessionToken;
    userId : UserId;
    expiresAt : Int;
  };

  public type RegisterRequest = {
    username : Text;
    password : Text;
  };

  public type LoginRequest = {
    username : Text;
    password : Text;
  };

  public type AuthResult = {
    #ok : { token : SessionToken; user : UserInfo };
    #err : Text;
  };

  public type UserInfo = {
    id : UserId;
    username : Text;
    role : UserRole;
  };

  // --- Medicine types ---
  public type MedicineStatus = {
    #safe;
    #nearExpiry;
    #expired;
  };

  public type Medicine = {
    id : Nat;
    userId : UserId;
    name : Text;
    expiryDate : Text;
    batchNumber : Text;
    manufacturer : Text;
    notes : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  public type AddMedicineRequest = {
    name : Text;
    expiryDate : Text;
    batchNumber : Text;
    manufacturer : Text;
    notes : Text;
  };

  public type UpdateMedicineRequest = {
    id : Nat;
    name : Text;
    expiryDate : Text;
    batchNumber : Text;
    manufacturer : Text;
    notes : Text;
  };

  public type MedicineResult = {
    #ok : Medicine;
    #err : Text;
  };

  public type MedicinesResult = {
    #ok : [Medicine];
    #err : Text;
  };

  // Mutable counters / flags passed by reference to mixins
  public type State = {
    var nextMedicineId : Nat;
    var initialized : Bool;
  };
};

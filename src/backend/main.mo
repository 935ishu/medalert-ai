import Types "types/medicine-auth";
import MedicineAuthApi "mixins/medicine-auth-api";
import List "mo:core/List";
import Map "mo:core/Map";

actor {
  let users = List.empty<Types.User>();
  let sessions = Map.empty<Types.SessionToken, Types.Session>();
  let medicines = List.empty<Types.Medicine>();
  let state : Types.State = { var nextMedicineId = 1; var initialized = false };

  include MedicineAuthApi(users, sessions, medicines, state);
};

module Features = struct
  type question = { title : string } [@@deriving of_yaml]

  type metadata = {
    title : string;
    description : string option;
    questions : question list option;
    subfeatures : metadata list option;
  }
  [@@deriving of_yaml]

  type metadata_list = metadata list [@@deriving of_yaml]

  type t = {
    title : string;
    description : string option;
    questions : question list;
    subfeatures : t list;
  }

  let rec of_metadata (m : metadata) : t =
    {
      title = m.title;
      description = m.description;
      questions = Option.value ~default:[] m.questions;
      subfeatures =
        Option.value ~default:[] m.subfeatures |> List.map of_metadata;
    }

  let decode data =
    let metadata = metadata_list_of_yaml data in
    Result.map (List.map of_metadata) metadata

  let all () =
    Utils.yaml_file decode "features_vs_problems.yml"
    |> Utils.Result.get_ok ~error:(fun (`Msg m) -> Invalid_argument m)
end

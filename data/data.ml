module People = struct
  type other_social = { title : string; href : string } [@@deriving of_yaml]

  type metadata = {
    slug : string;
    name : string;
    affiliation : string;
    bio : string;
    github : string option;
    twitter : string option;
    linkedin : string option;
    mastodon : string option;
    twitch : string option;
    youtube : string option;
    other_socials : other_social list;
  }
  [@@deriving of_yaml]

  type metadata_list = metadata list [@@deriving of_yaml]

  type social =
    | GitHub of string
    | Twitter of string
    | LinkedIn of string
    | Mastodon of string
    | Twitch of string
    | YouTube of string
    | Other of { title : string; href : string }

  type t = {
    slug : string;
    img_src : string;
    name : string;
    affiliation : string;
    bio : string;
    socials : social list;
  }

  let of_metadata (m : metadata) : t =
    {
      slug = m.slug;
      img_src = "/avatars/" ^ m.slug ^ ".jpg";
      name = m.name;
      affiliation = m.affiliation;
      bio = m.bio;
      socials =
        ((match m.github with
         | Some username -> [ GitHub username ]
         | None -> [])
        @ (match m.twitter with
          | Some username -> [ Twitter username ]
          | None -> [])
        @ (match m.linkedin with
          | Some username -> [ LinkedIn username ]
          | None -> [])
        @ (match m.mastodon with
          | Some username -> [ Mastodon username ]
          | None -> [])
        @ (match m.twitch with
          | Some username -> [ Twitch username ]
          | None -> [])
        @
        match m.youtube with
        | Some username -> [ YouTube username ]
        | None -> [])
        @ List.map
            (fun (o : other_social) -> Other { title = o.title; href = o.href })
            m.other_socials;
    }

  let decode data =
    let metadata = metadata_list_of_yaml data in
    Result.map (List.map of_metadata) metadata

  let all =
    Read_yaml.yaml_file decode "2024/people.yml"
    |> Read_yaml.Result.get_ok ~error:(fun (`Msg m) -> Invalid_argument m)

  let get_by_slug slug =
    List.find (fun (speaker : t) -> speaker.slug = slug) all
end

module RecommendedEvents = struct
  type event = { name : string; logo_url : string; url : string }

  let all : event list =
    [
      {
        name = "BOBKonf";
        logo_url = "/img/recommended-events/bobkonf.png";
        url = "https://bobkonf.de";
      };
    ]
end

module Sessions = struct
  type metadata = {
    slug : string;
    title : string;
    speakers : string list;
    abstract : string;
    kind : string;
  }
  [@@deriving of_yaml]

  type metadata_list = metadata list [@@deriving of_yaml]
  type kind = Workshop | Talk

  type t = {
    slug : string;
    title : string;
    speakers : People.t list;
    abstract : string;
    kind : kind;
  }

  let of_metadata (m : metadata) : t =
    {
      slug = m.slug;
      title = m.title;
      speakers = m.speakers |> List.map People.get_by_slug;
      abstract =
        m.abstract
        |> Cmarkit.Doc.of_string ~strict:true
        |> Cmarkit_html.of_doc ~safe:false;
      kind =
        (match m.kind with
        | "talk" -> Talk
        | "workshop" -> Workshop
        | t -> failwith ("session kind not recognized: " ^ t));
    }

  let decode data =
    let metadata = metadata_list_of_yaml data in
    Result.map (List.map of_metadata) metadata

  let all =
    Read_yaml.yaml_file decode "2024/sessions.yml"
    |> Read_yaml.Result.get_ok ~error:(fun (`Msg m) -> Invalid_argument m)
end

let speakers = People.all

module Sponsors = struct
  type sponsor = { name : string; logo_url : string; url : string }

  let all : sponsor list =
    [
      {
        name = "Tarides";
        logo_url = "/img/tarides.webp";
        url = "https://tarides.com";
      };
      {
        name = "Ahrefs";
        logo_url = "/img/ahrefs.svg";
        url = "https://ahrefs.com";
      };
      {
        name = "Jane Street";
        logo_url = "/img/jane_street.svg";
        url = "https://www.janestreet.com/";
      };
      {
        name = "LightSource";
        logo_url = "/img/lightsource.svg";
        url = "https://lightsource.ai/";
      };
      {
        name = "Hyper";
        logo_url = "/img/hyper.svg";
        url = "https://hyper.systems";
      };
    ]
end

module Schedule = struct
  type event = { event : string; colspan : int option; rowspan : int option }
  [@@deriving of_yaml]

  type schedule_row = {
    time : string;
    yellow_giant : event option;
    apollo : event option;
    hangout_hub_room : event option;
    hangout_hub : event option;
  }
  [@@deriving of_yaml]

  type schedule = { date : string; schedule : schedule_row list }
  [@@deriving of_yaml]

  let day_one =
    Read_yaml.yaml_file schedule_of_yaml "2024/schedule/16-09.yaml"
    |> Read_yaml.Result.get_ok ~error:(fun (`Msg m) -> Invalid_argument m)

  let day_two =
    Read_yaml.yaml_file schedule_of_yaml "2024/schedule/17-09.yaml"
    |> Read_yaml.Result.get_ok ~error:(fun (`Msg m) -> Invalid_argument m)
end

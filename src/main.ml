let write_file path content =
  let parent_dir =
    Fpath.of_string path |> Result.get_ok |> Fpath.parent |> Fpath.to_string
  in
  Sys.command ("mkdir -p " ^ parent_dir) |> ignore;
  let oc = open_out path in
  Printf.fprintf oc "%s" content;
  close_out oc

let render_homepage () =
  let html = Templates.Home.make () |> JSX.render in
  write_file "output/index.html" html

let render_session_page (s : Data.Sessions.t) =
  let html = Templates.Session.render s |> JSX.render in
  write_file ("output/2024/" ^ s.slug ^ "/index.html") html

let render_privacy_policy () =
  let html = Templates.Privacy.make () |> JSX.render in
  write_file "output/privacy/index.html" html

let () =
  render_homepage ();
  render_privacy_policy ();
  Data.Sessions.all
  |> List.iter (fun (s : Data.Sessions.t) -> render_session_page s)

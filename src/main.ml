let render_homepage () =
  let html =
    Templates.Home.make () |> JSX.render |> Printf.sprintf "<!doctype html>%s"
  in
  let oc = open_out "output/index.html" in
  Printf.fprintf oc "%s" html;
  close_out oc

let render_privacy_policy () =
  let html =
    Templates.Privacy.make () |> JSX.render
    |> Printf.sprintf "<!doctype html>%s"
  in
  let oc = open_out "output/privacy/index.html" in
  Printf.fprintf oc "%s" html;
  close_out oc

let () =
  render_homepage ();
  render_privacy_policy ()

let () =
  let features = Data.all () in
  let html_page = Template.render features in
  let oc = open_out "asset/index.html" in
  Printf.fprintf oc "%s" html_page;
  close_out oc

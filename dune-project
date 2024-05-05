(lang dune 3.6)

(name fun_ocaml)

(source
 (github sabine/fun-ocaml.com))

(authors
 "Sabine")

(maintainers "Sabine")

(generate_opam_files true)

(package
 (allow_empty)
 (name fun_ocaml)
 (synopsis "Fun OCaml Website")
 (description
  "This package generates the HTML pages found at https://fun-ocaml.com")
 (depends
  (ocaml
   (>= 4.14.0))
  dune
  dream-html
  bos
  fpath
  tailwindcss
  fmt
  (cmarkit
   (>= 0.2.0))
  ppx_deriving_yaml
  ))

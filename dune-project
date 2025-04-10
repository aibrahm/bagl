(lang dune 3.0)
(name bagl)

(generate_opam_files true)

(source (github aibrahim/bagl))
(license MIT)
(authors "Author")
(maintainers "Author")

(package
 (name bagl)
 (synopsis "A statically-typed functional language with tensor operations")
 (description "Bagl is a functional programming language with first-class tensor support and compile-time shape checking.")
 (depends
  (ocaml (>= 4.14))
  (dune (>= 3.0))
  (alcotest :with-test)))

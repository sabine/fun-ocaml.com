.DEFAULT_GOAL := all

.PHONY: all
all:
	opam exec -- dune build --root .

.PHONY: deps
deps: create_switch ## Install development dependencies
	opam install -y ocamlformat=0.26.0 ocaml-lsp-server
	opam install -y --deps-only --with-test --with-doc .

.PHONY: create_switch
create_switch: ## Create switch and pinned opam repo
	opam switch create . 5.1.1 --no-install
.PHONY: switch
switch: deps ## Create an opam switch and install development dependencies

.PHONY: build
build: ## Build the project, including non installable libraries and executables
	opam exec -- dune build --root .

.PHONE: assets
assets:
	mkdir -p output
	cp -r asset/* output/

.PHONY: css
css:
	mkdir -p output/css
	opam exec -- tailwindcss -m -c tailwind.config.js -i src/css/styles.css -o output/css/main.css


.PHONY: run
run: css assets
	mkdir -p output/privacy
	opam exec -- dune exec main
	cp output/css/main.css output/css/main.$(shell md5sum output/css/main.css | cut -d' ' -f1).css
	@echo "Replacing '/css/main.css' with '/css/main.$(shell md5sum output/css/main.css | cut -d' ' -f1).css' in all *.html files in output..."
	find output -name '*.html' -exec sed -i 's/\/css\/main.css/\/css\/main.$(shell md5sum output/css/main.css | cut -d' ' -f1).css/g' {} \;


.PHONY: clean
clean: ## Clean build artifacts and other generated files
	opam exec -- dune clean --root .

.PHONY: fmt
fmt: ## Format the codebase with ocamlformat
	opam exec -- dune build --root . --auto-promote @fmt

.PHONY: watch
watch: ## Watch for the filesystem and rebuild on every change
	opam exec -- dune build @run -w --force --no-buffer

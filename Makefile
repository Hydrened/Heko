all:
	npm start run

m:
	tsc -p tsconfig.main.json

r:
	tsc -p tsconfig.renderer.json

mr: m r

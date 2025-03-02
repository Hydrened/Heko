all:
	npm start

build:
	npm run build

clean:
	del /q "dist"

rebuild: clean build

all:
	npm start

build:
	npm run build

clean:
	rmdir /s /q dist
	mkdir dist

rebuild: clean build

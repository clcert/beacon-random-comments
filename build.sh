#!/bin/bash

if [ ! -d /build ]; then
	mkdir build
fi

zip -r build/beacon-random-comments.zip . -x build\* /web-ext-artifacts\*  /screenshots\* /.git\* /.idea\* /.directory\* .gitignore build.sh

# Coding Guide

This document briefly explains the Random Comments interface.js API. Also, you can guide yourself by reading the existing content scripts (e.g. instagram.js) to have an idea about how does it work.

Random Comments is implemented under the 'State Patern' <sup>[1](#state-pattern)</sup>, you can interact with it by ignoring this pattern but I advice to maintain this style because of the simplicity of the code and to maintain the chronological order of the events in the extension.



<a name="state-pattern">1</a>: More about state pattern in javascript here.


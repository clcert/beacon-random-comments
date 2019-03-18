# Content Scripts Coding Guide

This document briefly explains the Random Comments interface.js API. Also, you can guide yourself by reading the existing content scripts (e.g. interface.js) to have an idea about how does it work.

Random Comments is implemented under the 'State Patern' <sup>[1](#state-pattern)</sup>, you can interact with it by ignoring this pattern but I advice to maintain this style because of the simplicity of the code and to maintain the chronological order of the events in the extension.

## Scrapping Functions

This section is to mention some useful functions to implement before start interacting with the API:

- debugLog(args...): Prints the arguments if the debug global variable is true. Use it to avoid debugging logs when the user use the production version.
- getHostComment: Returns a javascript object containing the post host username and post comment.
- getComment(i): Returns a javascript object containing the username and comment of the i-th comment in the post.
- setCommentColor(i, color): Use it to highlight the current chosen comment. My implementation returns nothing.
- Show and Hide the loading icon: Use it to hide the scrapping process of loading the comments.

You can do what this function do inline, but for readability and avoid repeated code, is prefered to implemenent them before.


## State Pattern Functions

Basicaly the functions used in the state pattern are divided in two groups, the first is the 'handler' and the second is the 'states'. Here I will cover both.

### StateHandler

This function handles the current state. Also is in charge of listening and respond the 'state request' of the extension interface, this is because the interface has no memory, so when the user closes it does not keep track about the current state. It has been done this way to avoid adding unnecessary permissions to the extension, so it saves the data as variables in the IFEE contained in the content script (which is injected to the post by the extension).

The StateHandler function also should handle the case when the interface request the current state and the url of the post has changed, being able to restart the parameters saved in the inner variables and also setting the state as the initial.

<a name="state-pattern">1</a>: More about state pattern in javascript [here](https://www.dofactory.com/javascript/state-design-pattern).


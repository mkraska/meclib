# Maxima Based Feedback Functions

For documentation see the [wiki](https://github.com/mkraska/meclib/wiki/Feedback-Overview). 

Use this to include functions into the question variables:

    stack_include("https://raw.githubusercontent.com/mkraska/meclib/main/Maxima/fb_fbd.mac");

The folder `dist/` holds compact copies of the libraries (no comments, no indentation; about 30 % smaller),
which STACK fetches and parses faster when it compiles a question:

    stack_include("https://raw.githubusercontent.com/mkraska/meclib/main/Maxima/dist/fb_fbd.mac");

They are generated from the files here by `python tools/build_dist.py` (run it after every change of a
library; `--check` reports out-of-date copies). Edit only the files in this folder, never those in `dist/`.

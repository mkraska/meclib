# Maxima Based Feedback Functions

For documentation see the [wiki](https://github.com/mkraska/meclib/wiki/Feedback-Overview). 

Use this to include functions into the question variables:

    stack_include("https://raw.githubusercontent.com/mkraska/meclib/main/Maxima/fb_fbd.mac");

Each file sets a version variable, the date of its last change: `fb_fbd_version`, `fb_value_version`,
`fb_spline_version` (e.g. `"2026 10 23"`). It shows which version STACK compiled into a question, e.g. in a
`[[debug/]]` block or in the demo question `demo_questions/meclib_diagnostics.xml`. Update it with every
change of the file.

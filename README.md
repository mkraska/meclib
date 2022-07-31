# Meclib

Meclib is a code block to be used in STACK questions of the Moodle learning management system. STACK comes with integration of JSXGraph, a JavaScript library for interactive graphics. In STACK questions, this can be used to display parametrized/randomized geometry or as a graphical input channel. Usually, JSXGraph blocks in STACK question contain JavaScript code specific to that question. There are mechanisms for conveying variables from the CAS kernel of STACK (Maxima) to the widget and vice versa.

The code block can be copied to the question text of a STACK question. It contains a number of geometric object definitions (classes), which can be instanciated by a properly formatted Maxima list of lists. Thus, no need to edit JavaScript code for the question author, as long as the set of objects is sufficient.

The set of objects is created with sketches of mechanical systems in mind (support and load symbols, bars, ropes, disks, annotations).

In STACK 4.4, Meclib can be dynamically inserted using an  `[[include /]]` text block.

Documentation: see [Wiki](https://github.com/mkraska/meclib/wiki).

[jsfiddle tryout, JSXGraph 1.4.4]( https://jsfiddle.net/qyw45jLs/10/) STACK 4.4<br>
[jsfiddle tryout, JSXGraph 1.2.1]( https://jsfiddle.net/ezcbm9vw/5/) STACK 4.3


![Demo](images/Meclib%20demo.png?raw=true "Screenshot from the demo question")

## Reference

Kraska, Martin, & Schulz, Dennis. (2021). Automatic assessment of free body diagrams using STACK. Presented at the International Meeting of the STACK Community 2021, Zenodo. http://doi.org/10.5281/zenodo.4916138

Kraska, Martin. (2022). Meclib: Dynamic and interactive figures in STACK questions made easy. Presented at the International Meeting of the STACK Community 2022, Leoben, Austria. [https://github.com/mkraska/meclib/blob/main/References/STACK%202022%20Kraska%20V2.pdf](References/STACK%202022%20Kraska%20V2.pdf)

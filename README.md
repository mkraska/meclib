# meclib

Meclib is a code block to be used in STACK questions of the Moodle learning management system. STACK comes with integration of JSXGraph, a JavaScript library for interactive graphics. In STACK questions, this can be used to display parametrized/randomized geometry or as a graphical input channel. Usually, JSXGraph blocks in STACK question contain JavaScript code specific to that question. There are mechanisms for conveying variables from the CAS kernel of STACK (Maxima) to the widget and vice versa.

Meclib is a special JSXGraph block to be copied into the STACK question. It contains a number of geometric object definitions (classes), which can be instanciated by a properly formatted Maxima list of lists. Thus, no need to edit JavaScript code for the question author, as long as the set of objects is sufficient.

The set of objects is created with sketches of mechanical systems in mind (support and load symbols, bars, ropes, disks, annotations).



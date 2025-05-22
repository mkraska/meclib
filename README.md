# Meclib

Meclib is a set of tools to simplify authoring authoring of STACK questions for the Moodle learning management system. Focus is on 
- JSXGraph based static and interactive illustrations controlled by Maxima lists (defined in the question variables)
- Maxima functions for rich formative feedback on interactive graphic input and on numeric or symbolic expressions.

STACK comes with integration of JSXGraph, a JavaScript library for interactive graphics. In STACK questions, this can be used to display parametrized/randomized geometry or as a graphical input channel. Usually, JSXGraph blocks in STACK question contain JavaScript code specific to that question. There are mechanisms for conveying variables from the CAS kernel of STACK (Maxima) to the widget and vice versa.

The set of objects is created with sketches of mechanical systems in mind (support and load symbols, bars, ropes, disks, annotations). The most advanced application is the interactive creation of free body diagrams with rich formative feedback.

In STACK 4.4, Meclib can be dynamically inserted using an  `[[include /]]` text block.

Documentation: see [Wiki](https://github.com/mkraska/meclib/wiki).

## Reference

Kraska, Martin, & Schulz, Dennis. (2021). Automatic assessment of free body diagrams using STACK. Presented at the International Meeting of the STACK Community 2021, Zenodo. http://doi.org/10.5281/zenodo.4916138

Kraska, Martin. (2022). Meclib: Dynamic and interactive figures in STACK questions made easy. Presented at the International Meeting of the STACK Community 2022, Leoben, Austria. [https://github.com/mkraska/meclib/blob/main/References/STACK%202022%20Kraska%20V2.pdf](References/STACK%202022%20Kraska%20V2.pdf)

Kraska, Martin. (2022). Meclib: Dynamic and Interactive Figures in STACK Questions Made Easy. International Journal of Emerging Technologies in Learning (iJET). 17. 15-27. http://doi.org/10.3991/ijet.v17i23.36501. 

Kraska, Martin (2025). Meclib: supporting mechanical systems. STACK application case study. https://stack-assessment.org/CaseStudies/2025/Mechlib/

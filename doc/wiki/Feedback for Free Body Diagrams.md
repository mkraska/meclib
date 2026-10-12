[[FBD Feedback Structure]]

[[FBD Generic Validation Feedback]]

### Helper functions and feedback for specific objects

These functions are defined in [fb_fbd.mac](https://raw.githubusercontent.com/mkraska/meclib/main/Maxima/fb_fbd.mac). To use them, include the macro file in the question variables 

    stack_include("https://raw.githubusercontent.com/mkraska/meclib/main/Maxima/fb_fbd.mac");

- [[angle()]] angle between two directional objects
- [[direction()]] Identify the direction of objects, e.g. for parallelity check
- [[moment_of_force()]] Moment of a [["force"]] object about a given point
- [[parallelp()]] Check if two directional objects are parallel
- [[fb_fbd()]] Generic checks of a free-body diagram in one call: system boundaries, names (missing, taken, the same at several supports), number of forces and moments
- [[fb_objects()]] Read the objects input (fast replacement of `stackjson_parse(objects)`)
- [[fb_EE()]] Feedback on equations of equilibrium against the sums of the student's free-body diagram
- [[fb_force()]] Check name, direction and line of action of a force
- [[fb_name()]] Check if the name of an object is in a given list.
- [[fb_reactions()]] Check the number of reaction forces and reaction moments.
- [[fb_system()]] Check of activation/deactivation of elements.
- [[fb_unique_names()]] Check that the reactions at several supports have different names.
- [[fb_contact_reactions()]] Names of the normal and the friction force at a contact, for reference solutions with the student's names.
- [[MatchByParallel()]] Reduce reactions in `names` to those who are parallel to the support


- [[Feedback for "contact"]]
- [[Feedback for "fix1"]]
- [[Feedback for "fix12"]]
- [[Feedback for "fix123"]]
- [[Feedback for "fix13"]]
- [[Feedback for unidirectional supports]], [[fb_bar]], [[fb_bar_name]]
 
- [[Feedback for line loads]] Check value, direction and position

- [[Sums of Forces and Moments]] Create the references solution for feedback on the balance equations


### Duplicate Names

[[fb_unique_names()]] checks that the reactions at a list of supports all have different names, e.g. when two contacts accept the same name `N`. Other loads are not compared.

### Attached Forces and Moments

if a de-activated element has active forces or moments nearby, a list of indices is returned in the `names` list


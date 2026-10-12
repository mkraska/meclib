`[ "contact", "name", [x, y], [dx, dy], targetRef, lineLength, visible ]`

Point-type support representing a contact between the sketched body and an environment object that gets cut away. Whether the contact is smooth or rough (static or kinetic friction) is decided in the feedback, see [[Feedback for "contact"]]. Appears as a gray cross (normal + tangent line) once the referenced object is deactivated.

- `"name"` label, typeset in MathJax math mode (may be empty)
- `[x, y]` contact point
- `[dx, dy]` normal direction vector (**outward**, need not be normalized); the tangent is perpendicular to it
- `targetRef` name (string) or 1-based index (integer) of the object that this contact replaces once cut away
- `lineLength` (optional, default `3`) length of the gray cross indicating normal/tangent snap directions, in grid units (the default leaves 1.5 units on each side for a force arrow)
- `visible` (optional, default `true`) whether the gray cross is ever drawn; it is only shown while the referenced object is deactivated

Status (for `names`/free body diagram matching) is derived automatically from the referenced object: `"hide"` (eligible for a reaction) once that object is deactivated, `"show"` otherwise.

See [[Feedback for "contact"]] for feedback functions in free body diagrams.

Tip: a second contact at the same point with another direction (a dummy that no feedback checks) hides which of the gray crosses is the right one.

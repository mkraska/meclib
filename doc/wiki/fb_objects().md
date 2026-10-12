### `obj: fb_objects(objects)`

- `objects` the content of the objects input (the JSON text the meclib graphic writes)

[Source](https://github.com/mkraska/meclib/blob/main/Maxima/fb_fbd.mac)

Returns the object list as a Maxima list, the same as STACK's `stackjson_parse(objects)`, but much faster. `stackjson_parse()` needs time that grows with the square of the length of the text: about 1.2 s for a sketch of 25 objects, and that in every PRT that reads the sketch. `fb_objects()` reads the text in one pass (0.02 s for the same sketch).

Use it in place of `stackjson_parse(objects)` in the feedback variables:

    obj: fb_objects(objects);

Strings, numbers, `true`, `false`, `null` and nested lists are read like `stackjson_parse()` does; a text with JSON objects (`{...}`), which meclib does not write, is passed on to `stackjson_parse()`.

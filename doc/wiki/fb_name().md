### `[txt, isOK]: fb_name(n, i, lon, show)`

- `txt` feedback text (empty if the name is accepted or no reaction is found)
- `isOK` flag for the test result
- `n` the `names` array (content of the `names` input field)
- `i` index of the support or contact object that is replaced by the reaction
- `lon` list of accepted names, as strings or symbols, e.g. `["N_A", "A", "F_A"]` or `[N_A, A, F_A]`
- `show` (optional, default `true`) whether the feedback lists the accepted names

[Source](https://github.com/mkraska/meclib/blob/main/Maxima/fb_fbd.mac)

`fb_name()` only checks whether the name the student gave the reaction at object `i` is one of the accepted names. It is kept separate from `fb_contact()`, `fb_unidir()`, `fb_bar()` etc. on purpose, so that a question can score the naming independently of the geometric and physical correctness of the reaction.

Checks:

- Is a reaction matched to object `i` (`n[i]` is a non-empty list of load indices)? If not, the result is `["", false]` without text - the support's own feedback function on the same index reports the missing reaction.
- If several loads are matched to object `i`, the first one is checked.
- Is its name a member of `lon`? If yes: `["", true]`. If not, the feedback names the offending symbol and, unless `show` is `false`, the accepted names:

| `lon` | feedback (German / English) |
|---|---|
| `["F"]` | \(R \) ist kein passender Name. Akzeptiert: \(F\). / \(R \) is not an acceptable name. Accepted: \(F\). |
| `["F", "F_q"]` | ... Akzeptiert: \(F\) oder \(F_q\). / ... Accepted: \(F\) or \(F_q\). |
| `["F", "F_q", "Q"]` | ... Akzeptiert: \(F\), \(F_q\) oder \(Q\). / ... Accepted: \(F\), \(F_q\) or \(Q\). |
| `["F"]`, `show` = `false` | \(R \) ist kein passender Name. / \(R \) is not an acceptable name. |

### Typical PRT

Feedback variables:

```
obj: stackjson_parse(objects);
[text, isOK]: fb_unidir(obj, names, i_SB, "Pendelstütze B: ");
[textn, isOKn]: fb_name(names, i_SB, ["B"]);
```

A separate node tests `isOKn = true` with `{@textn@}` as its feedback, so a wrong direction or position (via `fb_contact()`/`fb_unidir()`/`fb_bar()`) and an unsuitable name are reported and scored independently.

See also [[fb_reaction_name()]] for showing the student's name of a reaction in the question text.

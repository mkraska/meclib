How to make a [["crosshair"]] snap to the intersection point of two [["line2p"]]?

![image](https://user-images.githubusercontent.com/12987918/183425640-8f585e68-27c2-4151-8c35-3b3d226feccf.png)

This is the object specification:

```
[
    [ "grid", "","", -1,5,-1,4, 40, [1,1], [2,2] ],
    ["line2p","1",[3,0],[2,0],"n1"],
    ["line2p","2",[1,2],[1.5,0], "n2"],
    [ "crosshair", "", [1,1] ]
]
```

Add the following at the end of the meclib code:

```
const sectStyle = {fillOpacity:0, withLabel:false}
targets.push(board.create('intersection', [objects[1].g, objects[2].g, 0], sectStyle));
targets.push(board.create('intersection', [objects[1].n, objects[2].g, 0], sectStyle));
targets.push(board.create('intersection', [objects[1].g, objects[2].n, 0], sectStyle));
targets.push(board.create('intersection', [objects[1].n, objects[2].n, 0], sectStyle));
objects[3].p.setAttribute({snapToPoints:true})
```

1. The intersections of the lines and their normals are created.
2. They are appended to the `targets` list, the attractors of the movable points (crosshair, control points of `line2p`, forces, ...). The crosshair then glides on an intersection it was dropped on and follows it when a line is moved.
3. The crosshair is set to snap to points as well (by default it is only attracted by lines).

The index in `objects[...]` is the position of the object in the list (counting from 0): here `objects[1]` and `objects[2]` are the two `line2p`, `objects[3]` is the crosshair. In a question with index variables, write `objects[{#i_cross-1#}]`.

**Note:** the control points of a `line2p` ignore elements that depend on their own line (here: all four intersections), both as attractors and for snapping. Before meclib 2026 10 11 they did not: a control point dragged close to such an intersection got stuck on it (off-grid coordinates in the answer, console errors), see the test scene `tests/scenes/line2p_intersections.json`.

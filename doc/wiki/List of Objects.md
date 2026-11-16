Interactivity legend:

- "Switch": object can be activated or deactivated by double-click.
- "Move": object or it's control points can be dragged around with the mouse.
- "Delete": object can be deleted by double-click (if active)
- "Generate": object can generate [["force"]] or [["moment"]] objects by dragging sample objects with the mouse.

Return value: only relevant for interactive input. How names are typeset as labels: [[Labels and names]]

The input for the images in the table are found [here](https://github.com/mkraska/meclib/wiki/Test-examples#overview-of-objects)


| Object          | Interactivity | Return value in `names` | Example |
|--------         |--------       |---------          |--- |
| [["angle"]], [["angle1"]], [["angle2"]]  | | label string |![image](https://user-images.githubusercontent.com/12987918/184476430-38b6119e-d1e0-4cf7-aa9e-4e9952f03d5e.png) |
| [["axes"]]       |          |                 |  | 
| [["bar"]]       | Switch    | "show" or list of load indices if hidden         | ![image](https://user-images.githubusercontent.com/12987918/184477059-63951867-2359-4849-903b-c8492788192b.png) | 
| [["beam"]]      | Switch    | state             |![image](https://user-images.githubusercontent.com/12987918/184477264-719e9b01-6749-4123-8176-53abd09c7d45.png)  | 
| [["circle"]]    | Switch    | state             |![image](https://user-images.githubusercontent.com/12987918/184477427-32475f6f-e3d5-4269-8623-87b070564de5.png) | 
| [["circle2p"]]  | Move       | [x1,y1],[x2,y2]   |![image](https://user-images.githubusercontent.com/12987918/184477583-c8858ebd-bc3c-44d9-8ed2-97d631fe7cb7.png) | 
| [["crosshair"]] | Move       | [x,y] (scaled)    |![image](https://user-images.githubusercontent.com/12987918/184477926-638fc2ef-2a15-480e-8d02-5dc51fdc1636.png) | 
| [["contact"]]   | Switch (derived) | "show" or list of load indices if hidden | <img  height="60" alt="grafik" src="https://github.com/user-attachments/assets/8375db35-1c52-4ebc-b0d6-19e65ebfc3c2" /> |
| [["dashpot"]]   | Switch   | "show" or list of load indices if hidden             |![image](https://user-images.githubusercontent.com/12987918/184478102-4e29d6e1-dca1-49f7-800a-dfae3e1e7620.png) | 
| [["dim"]]       |               | label string      | ![image](https://user-images.githubusercontent.com/12987918/184478346-ca3dec38-464c-4ca2-b7d3-3cf05d0d8119.png)| 
| [["dir"]]       | Move              | label string      | ![image](https://user-images.githubusercontent.com/12987918/184478541-0e50c01b-0076-4da1-9cf5-82ae09b37070.png)| 
| [["disp"]]      |               | label string      |![image](https://user-images.githubusercontent.com/12987918/184478582-00d7303b-92bf-44d6-946a-a8a4cac4789f.png) | 
| [["fix1"]], [["fix12"]], [["fix123"]], [["fix13"]] | Switch | "show" or list of load indices if hidden  |![image](https://user-images.githubusercontent.com/12987918/184478810-e249bae2-61f2-4268-96fe-98455b9602d0.png) | 
| [["force"]]     | Move, delete       | expression        | ![image](https://user-images.githubusercontent.com/12987918/184482822-8139b352-3207-4999-be49-b1860394cde6.png)| 
| [["forceGen"]]  | Generate    | 0                 | ![image](https://user-images.githubusercontent.com/12987918/184483106-7a38cdf1-da00-4527-ab46-9abae8e6621e.png) | 
| [["frame"]]     |             | 0                 | <img width="143" alt="Bildschirmfoto 2023-06-27 um 16 26 09" src="https://github.com/mkraska/meclib/assets/105876203/8226e3d5-d997-4b1c-9c09-f10f76185103"> | 
| [["grid"]]      |               | 0                 | ![image](https://user-images.githubusercontent.com/12987918/184484604-ae23aa61-1b55-4c75-950a-52ac1df2ac61.png)| 
| [["label"]]     |               | 0                 |![image](https://user-images.githubusercontent.com/12987918/184483805-53e4b17a-d9cc-4d59-9a24-769c58d88f24.png) | 
| [["line"]]      |               | 0                 | ![image](https://user-images.githubusercontent.com/12987918/184484830-24d2d649-1456-4bc9-a579-b45ffe58e11f.png)| 
| [["line2p"]]    | Move    | [x1,y1],[x2,y2]   |![image](https://user-images.githubusercontent.com/12987918/184486604-f0e169ea-857e-4a1f-af76-72e15422a46a.png)| 
| [["mass"]]      |               | 0                 | ![image](https://user-images.githubusercontent.com/12987918/184485837-06fb94ae-53b0-4bf5-9ff5-59df3b1a4779.png)| 
| [["moment"]]    | Move, delete      | expression        |![image](https://user-images.githubusercontent.com/12987918/184486058-69642cb5-1932-4f19-8e03-7760f68a34cb.png) | 
| [["momentGen"]] | Generate    | 0                 | ![image](https://user-images.githubusercontent.com/12987918/184486199-97055608-66ba-466c-be1b-4cd79b02c09e.png) | 
| [["node"]]      |               | label string      |![image](https://user-images.githubusercontent.com/12987918/184486862-5d891815-65da-47a2-a13c-2781dbd64c96.png) | 
| [["point"]]     |               | label string      |![image](https://user-images.githubusercontent.com/12987918/184487112-4ba09e69-8657-4069-864f-c410c749d046.png) | 
| [["polygon"]]   | Switch    | state             |![image](https://user-images.githubusercontent.com/12987918/184487355-07cb4e34-09d8-4500-8ddc-08f79341fff2.png) | 
| [["q"]]         | Switch    | "show" or list of load indices if hidden |![image](https://user-images.githubusercontent.com/12987918/184487578-7fa26d4f-f82d-4424-a2ae-6ee07cd9dce6.png) | 
| [["rope"]]      | Switch    | "show" or list of load indices if hidden             |![image](https://user-images.githubusercontent.com/12987918/184487805-1acabdf2-5cdd-4045-80d5-b834ecfa3c3d.png) | 
| [["rot"]]       |               | label string      |![image](https://user-images.githubusercontent.com/12987918/184488025-3cc5bad6-05ae-478e-87b7-5a769229bc4a.png)| 
| [["spline"]]    | Move       | expression f(x)   | ![image](https://user-images.githubusercontent.com/12987918/184488283-a361a297-35b9-4923-a33f-e258feded6b0.png)| 
| [["springc"]]   | Switch   | "show" or list of load indices if hidden             |![image](https://user-images.githubusercontent.com/12987918/184488450-84547a5e-6449-430c-a213-14b1026e93fb.png) |
 | [["springt"]]   | Switch    | "show" or list of load indices if hidden              | ![image](https://user-images.githubusercontent.com/12987918/184488681-e67fce42-c2f1-4b30-8a31-621b3353c9dd.png)| 
| [["wall"]]      | Switch    | "show" or list of load indices if hidden              |![image](https://user-images.githubusercontent.com/12987918/184488914-08e82ffa-d4f4-4718-8a14-ea27f60e4d91.png) | 


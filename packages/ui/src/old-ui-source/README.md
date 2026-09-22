# Old Cribbit UI extraction source

This directory stores the old Cribbit UI source used for exact UI/UX extraction.

- CSS and HTML files are copied verbatim as active UI source material.
- Old `.ts` files mix template/composition with runtime/game authority, so they are stored as inert `.source.txt` references and exported only as strings for template extraction/audit.
- Do not import old runtime modules, game-engine logic, simulation, legality checks, timers, or local gameplay mutations from this tree.
- Clean app behavior must bind through the server-authoritative API/projection handlers.

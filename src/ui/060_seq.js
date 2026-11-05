/* ---------- SEQ ---------- */
let trkSheet;
function setTrack(i){U.tr=(i+16)%16;U.step=-1;U.lockStep=-1;vib(8);renderTab();if(trkSheet)renderTrkSheet()}
function closeTrkSheet(){if(trkSheet){trkSheet.remove();trkSheet=null}}


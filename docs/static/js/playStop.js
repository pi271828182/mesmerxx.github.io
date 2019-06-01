var playing = false;
var animate;
document.getElementById("control").addEventListener( 'click', function (event) {
    if (playing) {
        animate = document.getElementById('animate_to_stop');
        playing = false;

        sceneObj.userData.controls.autoRotate = true;
    }
    else{
        animate = document.getElementById('animate_to_play');
        playing = true;
        sceneObj.userData.controls.autoRotate = false;
    }
    animate.beginElement();
});

class GraphThree{
    static scenes;
    scene;
    renderer;

    group;
    threeDiv;//dom对象
    data;//存放几何体数据，name, length, color
    object_selection;

    // #FFCF71 10%, #2376DD
    //d3.color('#5fc3e4'), d3.color('#e55d87')
    color = d3.interpolate(d3.color('#FFCF71'), d3.color('#2376DD'));//颜色插值函数，网页背景色
    isCatalog = false;

    constructor(data, renderDivId, isCatalog) {//对象和两个字符串
        this.isCatalog = isCatalog;
        this.threeDiv = document.getElementById( renderDivId );
        this.renderer = new THREE.WebGLRenderer( {antialias: true, alpha: true} );
        this.renderer.setClearColor( 0xffffff, 0 );

        var width = this.threeDiv.clientWidth;
        var height = this.threeDiv.clientHeight;
        this.renderer.setSize(width, height);
        this.threeDiv.appendChild(this.renderer.domElement);

        // GraphThree.scenes = new Array();
        this.scene = new THREE.Scene();
        // GraphThree.scenes.push(this.scene);

        this.group = new THREE.Object3D();
        this.scene.add(this.group);

        this.scene.userData.element = document.getElementById(renderDivId);

        var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
        camera.position.x = 0;
        camera.position.y = 100;
        camera.position.z = 300;
        camera.lookAt(this.group.position);
        this.scene.add(camera);
        this.scene.userData.camera = camera;

        var light = new THREE.DirectionalLight(0xffffff, 1.0, 0);
        light.position.set(-100, 500, 200);
        this.scene.add(light);

        // var aLight = new THREE.AmbientLight( 0xaaaaaa ); // soft white light
        // this.scene.add( aLight );

        var orbitControls = new THREE.OrbitControls(this.scene.userData.camera, this.scene.userData.element);
        orbitControls.target = this.group.position;//控制焦点
        orbitControls.autoRotate = true;//自动旋转
        this.scene.userData.controls = orbitControls;

        this.data = data;
    }

    //光圈
    creatAureole(){
        //顶点着色器
        var vertexShader = [
        'varying vec3	vVertexWorldPosition;',
        'varying vec3	vVertexNormal;',
        'varying vec4	vFragColor;',
        'void main(){',
        '	vVertexNormal	= normalize(normalMatrix * normal);',//将法线转换到视图坐标系中
        '	vVertexWorldPosition	= (modelMatrix * vec4(position, 1.0)).xyz;',//将顶点转换到世界坐标系中
        '	// set gl_Position',
        '	gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'

    ].join('\n');
        //大气层效果
        THREE.AeroSphere = {
            uniforms: {
                coeficient: {
                    type: "f",
                    value: 1.0
                },
                power: {
                    type: "f",
                    value: 2
                },
                glowColor: {
                    type: "c",
                    value: new THREE.Color(0xfff5eb)
                }
            },
            vertexShader: vertexShader,//顶点着色器
            fragmentShader: [
                'uniform vec3	glowColor;',
                'uniform float	coeficient;',
                'uniform float	power;',

                'varying vec3	vVertexNormal;',
                'varying vec3	vVertexWorldPosition;',

                'varying vec4	vFragColor;',

                'void main(){',
                '	vec3 worldCameraToVertex= vVertexWorldPosition - cameraPosition;',	//世界坐标系中从相机位置到顶点位置的距离
                '	vec3 viewCameraToVertex	= (viewMatrix * vec4(worldCameraToVertex, 0.0)).xyz;',//视图坐标系中从相机位置到顶点位置的距离
                '	viewCameraToVertex	= normalize(viewCameraToVertex);',//规一化
                '	float intensity		= pow(coeficient + dot(vVertexNormal, viewCameraToVertex), power);',
                '	gl_FragColor		= vec4(glowColor, intensity);',
                '}'//vVertexNormal视图坐标系中点的法向量
                //viewCameraToVertex视图坐标系中点到摄像机的距离向量
                //dot点乘得到它们的夹角的cos值
                //从中心向外面角度越来越小（从钝角到锐角）从cos函数也可以知道这个值由负变正，不透明度最终从低到高
            ].join('\n')
        };
        //大气层
        var material1 = new THREE.ShaderMaterial({
            uniforms: THREE.AeroSphere.uniforms,
            vertexShader: THREE.AeroSphere.vertexShader,
            fragmentShader: THREE.AeroSphere.fragmentShader,
            blending: THREE.NormalBlending,
            transparent: true,
            depthWrite:false
        });
        var sphere = new THREE.SphereBufferGeometry(120, 32, 32);
        var mesh = new THREE.Mesh(sphere, material1);
        this.scene.add(mesh);
    }

    drawSVG(geo_data) {
        var that = this;
        var margin = 0,
                width = 2048,
                height = 1024;
        var svg = d3.select("#worldsvg")
                .append("svg")
                .attr("xmlns", "http://www.w3.org/2000/svg")
                .attr("version", "1.1")
                .attr("width", width + margin)
                .attr("height", height + margin)
        var projection = d3.geoMercator()
                .scale(200)
                .translate([760, 470]);
        var path = d3.geoPath().projection(projection);
        var map = svg.selectAll('path')
                .data(geo_data.features)
                .enter()
                .append('path')
                .attr('d', path)
                .attr('title', function (d) {
                    return d.properties.name;
                })
                .attr('id', function (d) {
                    return d.id;
                })
                .style('fill', function(d){
                    var countryColor;
                    if(filmNum[d.properties.name]){
                        var num = filmNum[d.properties.name];
                        if(num < 10){
                            countryColor = that.color(0);
                        }
                        else if (num<100) {
                            countryColor = that.color(0.15);
                        }
                        else if (num<500) {
                            countryColor =that.color(0.3);
                        }
                        else if (num<1000) {
                            countryColor =that.color(0.45);
                        }
                        else if (num<3000) {
                            countryColor = that.color(0.6);
                        }
                        else if (num<5000) {
                            countryColor = that.color(0.75);
                        }
                        else if (num<10000) {
                            countryColor = that.color(0.9);
                        }
                        else{
                            countryColor = that.color(1);
                        }
                    }
                    else{
                        countryColor = '#f4f9f4';
                    }
                    return countryColor;
                })
                .style('stroke', 'black')
                .style('stroke-width', 0.4);
    }

    //加载纹理
    getTexture(str){//str为纹理url
        var loader = new THREE.TextureLoader();
         return loader.load(str);
    }

    initGrid(){
        //平面
        var gridXZ = new THREE.GridHelper(200, 10, 0xa23131, 0xa23131);//4个参数分别是：网格宽度、等分数、中心线颜色，网格线颜色
        gridXZ.position.set( 0,0,0 );
        gridXZ.material.linewidth = 10;
        this.scene.add(gridXZ);
        if(this.isCatalog){
            gridXZ.scale.set(0.6, 0.6, 0.6)
        }
    }
}

class Histogram extends GraphThree{
    constructor(data, threeDivId, isCatalog){
        super(data, threeDivId, isCatalog);
    }

    start(){
        this.initGrid();
        this.creatAureole();
        this.initObject();
        this.layout();
        this.ObjectSelection();
        this.render();
    }

    render() {
        this.scene.userData.controls.update();

        if(this.isCatalog == false){
            this.object_selection.render(this.group, this.scene.userData.camera);
        }

        this.renderer.render(this.scene, this.scene.userData.camera);
        requestAnimationFrame(this.render.bind(this));//传递当前语境中的this
    }

    initObject(){
        var linear = d3.scaleLinear()
                            .domain([10000, 70000])
                            .range([0, 150]);
        for(var i in this.data) {
            var material = new THREE.MeshBasicMaterial( {
                color: this.color(linear(this.data[i].length)/150),
                opacity: 1
            });
            var cylinder = new THREE.CylinderGeometry(10, 10, linear(this.data[i].length));
            var mesh = new THREE.Mesh(cylinder, material);
            mesh.userData.length = this.data[i].length;
            mesh.material.wireframe = true;
            mesh.userData.name = this.data[i].name;
            mesh.userData.num = this.data[i].length;

            this.group.add(mesh);

            this.data[i].length = Math.ceil(linear(this.data[i].length));

        }
    }

    layout(){
        var objs = this.group.children;//数组

        var radius = 40;
        var angle = 0;
        var x, z;

        for(var i=0;i<objs.length; i++){
            if (objs[i].type == 'Mesh'){
                x = radius * Math.cos(angle);
                z = radius * Math.sin(angle);
                angle += Math.PI*2/this.data.length;
                objs[i].position.set(x, this.data[i].length/2, z);//因为position在几何体中心
            }
        }
    }

    ObjectSelection(){
        this.object_selection = new THREE.ObjectSelection({//个人封装的js，three.js官方库中无
            domElement: this.scene.userData.element,//渲染区域
            selected: function(selectObj) {//selectObj为选取返回对象
              // 显示信息，此处为个性化处理，该函数会作为传入objsel.js中作为处理函数
                if(selectObj !== null) {//判断是否为空，objsel.js中有对应
                    var meshObj = selectObj.object;
                    meshObj.material.color = new THREE.Color("rgb(220,76,65)");

                    document.getElementById('year').textContent = meshObj.userData.name + ' 年度';
                    document.getElementById('screenNum').textContent = meshObj.userData.num +' 块屏';
              } else {
                // delete info_text.select;//若无选择对象则删除显示变量等等
              }
            },
            clicked: function(selectObj) {//点击事件
                // obj.material.color.setHex( Math.random() * 0xe0e0e0 );
            },
            mousedown: function(selectObj) {//点击事件
                // obj.material.color.setHex( Math.random() * 0xe0e0e0 );
            },
            mouseup: function(selectObj) {//点击事件
                // obj.material.color.setHex( Math.random() * 0xe0e0e0 );
            }
          });
    }

}

class Pie extends GraphThree{
    constructor(data, renderDivId, isCatalog){
        super(data, renderDivId, isCatalog);
    }
    start(){
        // this.initThree();
        // this.initGrid();
        this.creatAureole();
        this.initObject();
        // this.initText({"fontsize" : "15pt"});
        this.ObjectSelection();
        this.render();

    }
    render()
    {
        this.scene.userData.controls.update();

        if(this.isCatalog == false){
            this.object_selection.render(this.group, this.scene.userData.camera);
        }

        //this.object_selection.render(this.group, this.scene.userData.camera);

        this.renderer.render(this.scene, this.scene.userData.camera);
        requestAnimationFrame(this.render.bind(this));//传递当前语境中的this
    }
    initObject(){
        var aLight = new THREE.AmbientLight( 0xaaaaaa );
        this.scene.add( aLight );

        var options = {
            depth: 20,//厚度
            bevelThickness: 1,
            bevelSize: 0.5,
            bevelSegments: true,
            bevelEnabled: 3,
            curveSegments: 12,
            steps: 1
        };

        //计算总值，以计算出角度比例
        var sum = 0;
        for(let i = 0; i<this.data.length; i++)
            sum += this.data[i].length;
        var startAngle = 0, endAngle = 0;

        // console.log(color(2));

        // var ordinal = d3.scaleOrdinal(d3.schemeCategory20);
        // var color = i => d3.rgb(ordinal(i)).toString();

        for(var i in this.data) {
            endAngle += this.data[i].length/sum*Math.PI*2;

            var material = new THREE.MeshPhongMaterial({
                color: this.color(endAngle/Math.PI/2),
                side: THREE.DoubleSide,
                wireframe: true,
            });
            var circle = this.drawShape(startAngle, endAngle-0.03);
            startAngle = endAngle;

            var geo = new THREE.ExtrudeGeometry(circle, options);

            var mesh = new THREE.Mesh(geo, material);
            mesh.rotation.x = -Math.PI/6;
            // mesh.material.wireframe = true;
            mesh.userData.length = this.data[i].length;
            mesh.userData.name = this.data[i].name;
            mesh.userData.ratio = (this.data[i].length/sum*100).toFixed(2);

            this.group.add(mesh);
        }
    }

    drawShape(startAngle, endAngle) {

        var shape = new THREE.Shape();
        shape.moveTo(0, 0);//当前位置
        shape.lineTo(0, 0);
        shape.moveTo(0, 0);
        shape.arc(0, 0, 75, endAngle, startAngle, true);

        return shape;
    }

    ObjectSelection(){
        this.object_selection = new THREE.ObjectSelection({//个人封装的js，three.js官方库中无
            domElement: this.scene.userData.element,//渲染区域
            selected: function(selectObj) {//selectObj为选取返回对象
              // 显示信息，此处为个性化处理，该函数会作为传入objsel.js中作为处理函数

            },
            clicked: function(selectObj) {//点击事件
                if(selectObj !== null) {

              } else {

              }
            },
            mousedown: function(selectObj) {//点击事件
                // obj.material.color.setHex( Math.random() * 0xe0e0e0 );
                if(selectObj !== null) {//判断是否为空，objsel.js中有对应
                    let mesh = selectObj.object;
                    let point = selectObj.point;
                    mesh.material.color = new THREE.Color("rgb(220,76,65)");
                    mesh.material.shininess = 100;
                    mesh.position.set(point.x/2, point.y/2, point.z/2);

                    document.getElementById('movieType').textContent = mesh.userData.name + ' ' + mesh.userData.length + '部';
                    document.getElementById('ratio').textContent = mesh.userData.ratio +'  %';
              } else {
                // delete info_text.select;//若无选择对象则删除显示变量等等
              }
            },
            mouseup: function(selectObj) {//点击事件
                let mesh = selectObj.object;
                let point = selectObj.point;
                mesh.material.color = new THREE.Color('#ffc15e');
                mesh.material.shininess = 30;
                mesh.position.set(0, 0, 0);
            }
          });
    }

}

class Earth extends GraphThree{
    group2;
    paramter;
    constructor(data, parameter, renderDivId, isCatalog){
        super(data, renderDivId, isCatalog);
        this.paramter = parameter;
    }

    start(){
        var that = this;
        d3.json("static/json/world_countries.json", function(data) {
            that.drawSVG(data);
            that.initObject();
            // that.initGrid();
            if(that.isCatalog == false){
                that.ObjectSelection();
            }
            else{
                that.creatAureole();
            }

            document.getElementById("worldsvg").style.display="none";
            document.getElementById("svgToCanvas").style.display="none";

            that.render();
        });

    }

    render() {
        this.scene.userData.controls.update();

        if(this.isCatalog == false){
            this.object_selection.render(this.group, this.scene.userData.camera);
        }

        this.renderer.render(this.scene, this.scene.userData.camera);
        requestAnimationFrame(this.render.bind(this));//传递当前语境中的this
    }

    //大气层
    creatAero(radius){
        var cloudsGeo = new THREE.SphereGeometry(radius,radius/2,radius/2);
        var cloudsMater = new THREE.MeshPhongMaterial({map:this.getTexture('static/texture/earth/earth_clouds_2048.png'),transparent:true,opacity:1});
        var cloudsMesh = new THREE.Mesh(cloudsGeo,cloudsMater);
        this.group.add(cloudsMesh);
    }

    creatGalaxy(radius){
        this.scene.add(new THREE.Mesh(
            new THREE.SphereGeometry(radius+10, radius/2, radius/2),
            new THREE.MeshBasicMaterial({
                map: this.getTexture('static/texture/earth/galaxy.png'),
                side: THREE.BackSide
            })
        ))
    }

    creatGeoEarth(){
        this.creatAero(99);
        this.initLocation(100)

        var that = this;
        that.scene.add(new THREE.AmbientLight(0x999999));

        var geometry = new THREE.SphereBufferGeometry( 100, 32, 32 );

        var material = new THREE.MeshPhongMaterial({
            map:         this.getTexture('static/texture/earth/2_no_clouds_4k.jpg'),
            bumpMap:     this.getTexture('static/texture/earth/elev_bump_4k.jpg'),//凹凸贴图
            bumpScale:   1,//凹凸贴图会对材质产生多大影响。典型范围是0-1。默认值为1。
            emissive:    new THREE.Color(0x6d3939),
            emissiveIntensity: 0.05,
            //wireframe:true,
            transparent: true,
            alphaMap:	 this.getTexture('static/texture/earth/grey.jpg'),//透明度贴图，黑色：完全透明;白色：完全不透明
        });
        var mesh2 = new THREE.Mesh( geometry, material );
        mesh2.rotation.y += Math.PI*15.22/10;//从北极往南极望是顺时针旋转，手动调整本初子午线与y0z平面的误差
        // mesh2.material.wireframe = true;
        that.group.add( mesh2 );
    }

    creatAdminEarth() {
        //var conColor = d3.interpolate(d3.color('#ffffff'), d3.color('#ff0000'));
        var conColor = d3.interpolate(d3.color('#FAD7A1'), d3.color('#2376DD'));

        var that = this;
        that.creatAero(98);
        that.scene.add(new THREE.AmbientLight(0xaaaaaa));

        var sphere = new THREE.SphereGeometry(100, 100, 100);

        var paths = document.getElementById("worldsvg").querySelector("svg").querySelectorAll("path");
        for (let i = 0; i < paths.length; i++) {
            paths[i].setAttribute("style", "fill-opacity:1; stroke-opacity:0.9");

            paths[i].style.stroke = '#' + Math.round(Math.random() * 0x0e0e0e);
            // paths[i].style.fill = "white";

            var countryColor;
            if(filmNum[paths[i].getAttribute('title')]){
                var num = filmNum[paths[i].getAttribute('title')];

                if(num < 10){
                    countryColor = conColor(0);
                }
                else if (num<100) {
                    countryColor = conColor(0.15);
                }
                else if (num<300) {
                    countryColor =conColor(0.3);
                }
                else if (num<500) {
                    countryColor =conColor(0.5);
                }
                else if (num<1000) {
                    countryColor = conColor(0.65);
                }
                else if (num<2000) {
                    countryColor = conColor(0.8);
                }
                else if (num<3000) {
                    countryColor = conColor(0.9);
                }
                else{
                    countryColor = conColor(1);
                }
            }
            else{
                countryColor = '#f4f9f4';
            }
            paths[i].style.fill = countryColor;

        }

        //获取svg内容
        var svg = document.getElementById('worldsvg').innerHTML;

        var canvas = document.getElementById('svgToCanvas');
        var c = canvas.getContext('2d');//画图对象

        //新建Image对象
        var img = new Image();
        //svg内容
        // img.src = 'data:image/svg+xml,' + unescape(encodeURIComponent(svg));//svg内容中可以有中文字符
        // img.src = 'data:image/svg+xml,' + svg;//svg内容中不能有中文字符

        //svg编码成base64
        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svg)));//svg内容中可以有中文字符
        // img.src = 'data:image/svg+xml;base64,' + window.btoa(svg);//svg内容中不能有中文字符

        //图片初始化完成后调用
        img.onload = function () {
            //将canvas的宽高设置为图像的宽高
            canvas.width = img.width;
            canvas.height = img.height;

            //canvas画图片
            c.drawImage(img, 0, 0);

            var texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            var material2 = new THREE.MeshPhongMaterial({
                map: texture,
                transparent: true,
                //wireframe: true,
                // side: THREE.DoubleSide,
            });
            material2.map.minFilter = THREE.LinearFilter;
            var mesh3 = new THREE.Mesh(sphere, material2);

            that.group.add(mesh3);
        };
    }

    initObject(){
        // this.scene.userData.camera.position.z = 600;
        this.group2 = new THREE.Object3D();
        this.scene.add(this.group2);
        // this.creatGalaxy()
        if(this.paramter.flag == 'geoEarth'){
            this.creatGeoEarth();
        }
        if(this.paramter.flag == 'adminEarth'){
            this.creatAdminEarth();
        }
    }

    initLocation(){
        var radius = 100;
        var firstPoint;
        for(let i in this.data){
            var sprite = this.createLocationSprite(this.data[i], radius);
            this.createText(sprite);
            this.group.add( sprite );
            if(i == 0){
                firstPoint = sprite;
            }
            else{
                this.creatLine(firstPoint, sprite, radius);
            }
        }
    }

    createText(value) {
        let canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = "#000000";
        ctx.font = "40px Yahei";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.userData.title, 256, 256, 512);
        let spriteMap = new THREE.CanvasTexture(canvas);
        spriteMap.needsUpdate = true;
        let spriteMaterial = new THREE.SpriteMaterial({map: spriteMap});
        let sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(30, 30, 1);
        this.group.add(sprite);//scene改group
        value.text = sprite;
        sprite.data = value;

        let ray = this.scene.userData.camera.position.clone().sub(value.position).clampLength(11, 12).add(value.position);
        sprite.position.copy(ray);
        return sprite
    }

    createLocationSprite(data, radius){
        var position = data.position;//this.lglt2xyz(location[0],location[1], radius);//经度，纬度

        var spriteMaterial = new THREE.SpriteMaterial({
            map: this.getTexture('static/texture/sprite/snowflake7_alpha.png'),
            color:0xffffff,
            depthTest: true
        });

        var sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(position.x*1.03, position.y*1.03, position.z*1.03);
        sprite.scale.set(5,5,5);

        sprite.userData.title = data.name;
        return sprite
    }

    creatLine(obj0, obj1, radius){
        var positions = [];
        positions.push(obj0.position);

        var midVector = obj0.position.clone().add(obj1.position.clone());
        if(midVector.length () > radius*1.5){
            midVector.multiplyScalar(0.8);
        }
        positions.push(midVector);
        if(midVector.length () < radius*1.1){
            var midVector1 = new THREE.Vector3(51.94899521179721, 41.15592339334897, -74.2104844406552).multiplyScalar(1.2);
            var midVector2= new THREE.Vector3(-21.648528130319804, -8.201190999766547 , -96.86507449452817).multiplyScalar(1.2);
            var midVector3= new THREE.Vector3(-97.91601591159608, -7.8530113363611385 , -16.534424883591797).multiplyScalar(1.2);
            positions.pop();
            positions.push(midVector1);
            positions.push(midVector2);
            positions.push(midVector3);
        }
        positions.push(obj1.position);
        var curve = new THREE.CatmullRomCurve3( positions );

        this.lightMove(curve);

        var points = curve.getPoints( 50 );
        var geometry = new THREE.BufferGeometry().setFromPoints( points );

        var material = new THREE.LineBasicMaterial( { color : 0x2376DD } );
        var curveObject = new THREE.Line( geometry, material );
        this.group.add(curveObject);
    }

    // 点动画
    lightMove(curve){
        var that = this;
        var pointGeometry = new THREE.SphereGeometry(1, 20, 20);
        var pointMaterial = new THREE.MeshBasicMaterial({color: 0xFFCF71});

        addLightPoint();
        function addLightPoint() {
            var index = 0;
            var pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);

            pointMesh.position.copy(curve.getPointAt(index));
            that.scene.add(pointMesh);

            function pointAnimate() {
                index+=0.001;
                if(index>= 1) {
                    index = 0;
                }
                pointMesh.position.copy(curve.getPointAt(index));
                requestAnimationFrame(pointAnimate);
            }
            pointAnimate();
        }

    }

    ObjectSelection(){
        this.object_selection = new THREE.ObjectSelection({//个人封装的js，three.js官方库中无
            domElement: this.scene.userData.element,//渲染区域
            selected: function(selectObj) {//selectObj为选取返回对象
                if(selectObj !== null) {
                    if(selectObj.object.type == "Sprite"){
                        // console.log(selectObj.object.userData.title);
                    }

                }
            },
            clicked: function(selectObj) {//点击事件
                if(selectObj !== null) {
                    console.log(selectObj.point);
                    // console.log(selectObj.object.type);
                    if(selectObj.object.type == "Sprite"){
                        // console.log(selectObj.object.userData.title);
                    }
                }
            },
            mousedown: function(selectObj) {//点击事件
                if(selectObj !== null) {//判断是否为空，objsel.js中有对应

                }
            },
            mouseup: function(selectObj) {//点击事件
                if(selectObj !== null) {//判断是否为空，objsel.js中有对应

                }
            }
          });
    }

}

class Map extends GraphThree {
    constructor(data, renderDivId, isCatalog) {
      super(data, renderDivId, isCatalog);
    }

    start() {
        var aLight = new THREE.AmbientLight( 0xaaaaaa );
        this.scene.add( aLight );

        var that = this;
        d3.json("static/json/world_countries.json", function(data) {
            that.drawSVG(data);
            that.initObject();
            // that.initGrid();
            if(that.isCatalog){
                that.creatAureole();
            }
            that.ObjectSelection();

            if(that.isCatalog == false){
                document.getElementById("worldsvg").style.display="none";
                document.getElementById("svgToCanvas").style.display="none";
            }
            that.render();
        });
    }

    render() {
      this.scene.userData.controls.update();

      if(this.isCatalog == false){
            this.object_selection.render(this.group, this.scene.userData.camera);
      }
      //this.object_selection.render(this.group, this.scene.userData.camera);

      this.renderer.render(this.scene, this.scene.userData.camera);
      requestAnimationFrame(this.render.bind(this));//传递当前语境中的this
    }

    createMesh(geom) {

        geom.applyMatrix(new THREE.Matrix4().makeTranslation(-390, -74, 0));

        var meshMaterial = new THREE.MeshBasicMaterial({
            color:  this.color(Math.random()),
            side: THREE.DoubleSide
        });
        var mesh = new THREE.Mesh(geom, meshMaterial);
        mesh.scale.x = 0.3;
        mesh.scale.y = 0.3;

        mesh.position.x += 100;
        mesh.position.y += 100;

        mesh.rotation.z = Math.PI;
        // mesh.rotation.x = -1.1;
        return mesh;
    }

    initObject(){

        var options = {
              depth: 1,//厚度
              bevelThickness: 1,//厚度
              bevelSize: 0.5,
              bevelSegments: true,
              bevelEnabled: 3,
              curveSegments: 12,
              steps: 1
          };

        // var colorMap = d3.interpolate(d3.color('#f1e4e4'), d3.color('#ff4057'));
        //#FAD7A1 10%, #2376DD
        var conColor = d3.interpolate(d3.color('#FAD7A1'), d3.color('#2376DD'));

        var linear = d3.scaleLinear()
                            .domain([0, 20000])
                            .range([0, 1]);

        var paths = document.getElementById("worldsvg").querySelector("svg").getElementsByTagName("path");


        for(var i=0;i<paths.length;i++){
            if(paths[i].getAttribute("title") == 'Antarctica')
                continue
            var pathString = paths[i].getAttribute("d");
            var shape = transformSVGPathExposed(pathString);
            var mesh = this.createMesh(new THREE.ExtrudeGeometry(shape, options));
            // console.log(paths[i].getAttribute("title"))
            mesh.userData.name = paths[i].getAttribute("title");
            if(filmNum[mesh.userData.name]){
                // console.log(mesh.userData.name, filmNum[mesh.userData.name])
                mesh.userData.num = filmNum[mesh.userData.name];
            }
            else{
                mesh.userData.num = 0;
            }
            // mesh.material.color = new THREE.Color(colorMap(linear(mesh.userData.num)));
            var countryColor;
            if(filmNum[paths[i].getAttribute('title')]){
                var num = filmNum[paths[i].getAttribute('title')];
                if(num < 10){
                    countryColor = conColor(0);
                }
                else if (num<100) {
                    countryColor = conColor(0.15);
                }
                else if (num<300) {
                    countryColor =conColor(0.3);
                }
                else if (num<500) {
                    countryColor =conColor(0.5);
                }
                else if (num<1000) {
                    countryColor = conColor(0.65);
                }
                else if (num<2000) {
                    countryColor = conColor(0.8);
                }
                else if (num<3000) {
                    countryColor = conColor(0.9);
                }
                else{
                    countryColor = conColor(1);
                }
            }
            else{
                countryColor = '#f4f9f4';
            }
            mesh.material.color = new THREE.Color(countryColor);
            this.group.add(mesh);
        }
    }

    ObjectSelection(){
        var that = this;
        this.object_selection = new THREE.ObjectSelection({//个人封装的js，three.js官方库中无
            domElement: this.scene.userData.element,//渲染区域
            selected: function(selectObj) {//selectObj为选取返回对象
                // 显示信息，此处为个性化处理，该函数会作为传入objsel.js中作为处理函数
                if (selectObj != null){
                    that.scene.userData.controls.autoRotate = false;
                    var meshObj = selectObj.object;
                    meshObj.material.color = new THREE.Color("rgb(220,76,65)");
                    document.getElementById('country').textContent = meshObj.userData.name;
                    document.getElementById('filmNum').textContent = meshObj.userData.num +' 部';
                } else {
                    that.scene.userData.controls.autoRotate = true;
                }

            },
            clicked: function(selectObj) {//点击事件
                if(selectObj !== null) {
                    
                    // console.log(selectObj.object.userData.name);

              } else {

              }
            },
            mousedown: function(selectObj) {//点击事件
                // obj.material.color.setHex( Math.random() * 0xe0e0e0 );
                if(selectObj !== null) {//判断是否为空，objsel.js中有对应

              } else {
                // delete info_text.select;//若无选择对象则删除显示变量等等
              }
            },
            mouseup: function(selectObj) {//点击事件

            }
          });
    }
}

class ForceDerict extends GraphThree{
    graph;
    dragObjects;//存放拖拽对象mesh
    world;//物理对象
    onDrag;//是否在拖拽中
    colorD3 = d3.scaleOrdinal(d3.schemeCategory10);

    constructor(data, threeDivId, isCatalog){
        super(data, threeDivId, isCatalog);
    }

    applyForce() {
        var that = this;
        var nodes = this.graph.nodes;
        var edges = this.graph.edges;
        if (!that.onDrag)
        {
            //计算质心
            let massCenter = new THREE.Vector3(0, 0, 0);
            nodes.forEach(value => {
                massCenter.add(value.pbody.position);
            });
            massCenter.divideScalar(nodes.length);
            //计算向心力
            let maxForce = 10 * massCenter.sub(new THREE.Vector3(0, 0, 0)).length();
            let forceCenter = massCenter.negate().clampLength(maxForce, Math.ceil(maxForce));
            //console.log(forceCenter);
            //添加向心力
            nodes.forEach(node => {
                node.pbody.force.copy(node.pbody.force.vadd(forceCenter));
            });
        }
        var camera = this.scene.userData.camera;
        nodes.forEach(value => {
            value.body.position.copy(value.pbody.position);
            value.body.quaternion.copy(value.pbody.quaternion);
            //计算文本位置
            let ray = camera.position.clone().sub(value.pbody.position).clampLength(11, 12).add(value.pbody.position);
            value.text.position.copy(ray);
            //添加斥力
            nodes.forEach(node => {
                if (node !== value && node.pbody.type === CANNON.Body.DYNAMIC)
                {
                    let distance = new THREE.Vector3().copy(node.pbody.position).distanceTo(value.pbody.position);
                    let maxForce = 100000;
                    let force = new THREE.Vector3().copy(node.pbody.position).sub(value.pbody.position).clampLength(maxForce / distance ** 2, Math.ceil(maxForce / distance ** 2));
                    node.pbody.force.copy(node.pbody.force.vadd(force));
                }
            });
        });
        edges.forEach(value => {
            value.body.geometry.verticesNeedUpdate = true;
        });
    }

    drawNode(nodes) {
        var that = this;
        nodes.forEach((value, index) => {
            function createText()
            {
                let canvas = document.createElement("canvas");
                canvas.width = 512;
                canvas.height = 512;
                let ctx = canvas.getContext("2d");
                ctx.fillStyle = "#000000";
                ctx.font = "75px Yahei";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(value.data.name, 256, 256, 512);
                let spriteMap = new THREE.CanvasTexture(canvas);
                spriteMap.needsUpdate = true;
                let spriteMaterial = new THREE.SpriteMaterial({map: spriteMap});
                let sprite = new THREE.Sprite(spriteMaterial);
                sprite.scale.set(30, 30, 1);
                that.group.add(sprite);//改
                value.text = sprite;
                sprite.data = value;
                return sprite
            }

            createText();

            function createBody()
            {
                let sphere_geometry = new THREE.SphereGeometry(10, 30, 30);
                if (value.data.post != 'movie') {
                    sphere_geometry = new THREE.SphereGeometry(8, 30, 30);
                }
                let sphere_material = new THREE.MeshPhongMaterial({
                    color: that.colorD3(Math.floor(Math.random()*10)),//that.color(Math.random()),
                    transparent: true,
                    opacity: 0.8,
                    // wireframe: true
                });
                if (value.id == 0){
                    sphere_material.color = new THREE.Color( 0xff5959 );
                }
                if (value.data.post == 'movie') {
                    sphere_material.color = new THREE.Color( 0xf09c67 );
                }
                if (value.data.post == 'director') {
                    sphere_material.color = new THREE.Color( 0xf09c67 );
                }
                let sphere = new THREE.Mesh(sphere_geometry, sphere_material);
                sphere.frustumCulled = false;
                {
                    let num = nodes.length;
                    let radius = 50 * num / 2 / Math.PI;
                    sphere.position.set(Math.cos(2 * Math.PI / num * index) * radius, Math.sin(2 * Math.PI / num * index) * radius, 0);
                }
                that.group.add(sphere);//改
                that.dragObjects.push(sphere);
                value.body = sphere;
                sphere.data = value;
                return sphere;
            }

            let sphere = createBody();

            let sphere_body = new CANNON.Body({
                mass: 1,
                shape: new CANNON.Sphere(10),
                linearDamping: 0.9,
                angularDamping: 0.9
            });
            sphere_body.position.copy(sphere.position);
            sphere_body.fixedRotation = true;
            that.world.addBody(sphere_body);
            value.pbody = sphere_body;
        });
    }

    drawEdge(edges) {
        var that = this;
        edges.forEach((value => {
            let material = new THREE.LineBasicMaterial({vertexColors: true, side: THREE.DoubleSide});
            let geometry = new THREE.Geometry();

            geometry.vertices.push(value.source.body.position);
            geometry.vertices.push(value.target.body.position);
            geometry.colors.push(value.source.body.material.color, value.target.body.material.color);
            let line = new THREE.Line(geometry, material);
            line.castShadow = true;
            line.receiveShadow = true;
            line.frustumCulled = false;
            that.group.add(line);//改
            value.body = line;

            value.source.data.friend.push(value.target);
            value.target.data.friend.push(value.source);

            let pbodyA = value.source.pbody;
            let pbodyB = value.target.pbody;
            let constraint = new CANNON.DistanceConstraint(pbodyA, pbodyB, 65, 100);
            that.world.addConstraint(constraint);
        }));
    }

    initObject(){
        var aLight = new THREE.AmbientLight( 0xeeeeee );
        this.scene.add( aLight );

        var that = this;

        // that.scene.userData.camera.position.z += 100;
        that.world = new CANNON.World();
        that.world.gravity.set(0, 0, 0);
        that.world.solver.iterations = 20;

        that.dragObjects = [];

        that.graph = new GRAPHVIS.Graph();//图
        //结点
        for(let i=0; i<that.data.nodes.length; i++){
            var node = new GRAPHVIS.Node(nodes[i]);
            that.graph.nodeSet[node.id] = node;
            that.graph.nodes.push(node);//结点加入图中
        }
        //边
        var nodes_graph = that.graph.nodeSet;//改
        for(let i=0; i<that.data.links.length; i++){
            var startNodeId = links[i].source;
            var endNodeId = links[i].target;
            var edge = new GRAPHVIS.Edge(nodes_graph[startNodeId], nodes_graph[endNodeId]);
            that.graph.edges.push(edge);

            nodes_graph[startNodeId].data.friend.push(nodes_graph[endNodeId]);
            nodes_graph[endNodeId].data.friend.push(nodes_graph[startNodeId]);
        }

        this.drawNode(this.graph.nodes);
        this.drawEdge(this.graph.edges);


        var controls = that.scene.userData.controls;
        that.onDrag = false;
        let existMouseMove = false;
        var dragControls = new THREE.DragControls(that.dragObjects, that.scene.userData.camera, this.renderer.domElement);
        dragControls.addEventListener('hoveron', function (event) {
            let friends = event.object.data.data.friend;
            for (let i in friends){
                friends[i].body.material.color = new THREE.Color( '#ff8364' );
            }

            controls.enabled = false;
        });
        dragControls.addEventListener('hoveroff', function (event) {
            let friends = event.object.data.data.friend;
            for (let i in friends){
                // friends[i].body.material.color = new THREE.Color( that.color(Math.random()) );
                friends[i].body.material.color = new THREE.Color( that.colorD3(Math.floor(Math.random()*10)) );

                let value = friends[i];
                let sphere_material = friends[i].body.material;
                if (value.data.post == 'movie') {
                    sphere_material.color = new THREE.Color( 0xf09c67 );
                }
                if (value.data.post == 'director') {
                    sphere_material.color = new THREE.Color( 0xf09c67 );
                }
                if (value.id == 0){
                    sphere_material.color = new THREE.Color( 0xff5959 );
                }
            }
            // event.object.material.color = new THREE.Color( that.color(Math.random()) );

            controls.enabled = true;
        });
        dragControls.addEventListener('dragstart', function (event) {
            event.object.data.pbody.type = CANNON.Body.KINEMATIC;//data=node
            event.object.data.pbody.updateMassProperties();
            that.onDrag = true;
        });
        dragControls.addEventListener('drag', function (event) {
            event.object.data.pbody.position.copy(event.object.position);
            existMouseMove = true;
        });
        dragControls.addEventListener('dragend', function (event) {
            event.object.data.pbody.type = CANNON.Body.DYNAMIC;
            event.object.data.pbody.updateMassProperties();
            that.onDrag = false;
            if (!existMouseMove && !!event.object.data.url && event.object.data.url !== '')
            {
                window.top.open(event.object.data.url);
            }
            existMouseMove = false;
        });
    }

    start(){
        // this.initGrid();
        // this.creatAureole();
        this.initObject();
        let preSimulate = 5;
        let tick = 0.02;
        console.time();
        for (let i = 0; i < preSimulate / tick; i++)
        {
            this.world.step(tick);
            this.applyForce();
        }
        console.timeEnd();
        this.lastTime = performance.now();
        this.render(this.lastTime);
    }

    render(now) {
        let timeSpan = now - this.lastTime;
        this.lastTime = now;
        if (timeSpan > 0)
        {
            this.world.step(Math.min(timeSpan, 100) / 1000);
            this.applyForce();
        }
        this.scene.userData.controls.update();

        this.renderer.render(this.scene, this.scene.userData.camera);
        requestAnimationFrame(this.render.bind(this));//传递当前语境中的this
    }
}

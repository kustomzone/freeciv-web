/**********************************************************************
    Freeciv-web - the web version of Freeciv. http://play.freeciv.org/
    Copyright (C) 2009-2016  The Freeciv-web project

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

***********************************************************************/

var webgl_textures = {};
var webgl_models_xml_strings = {};
var webgl_models = {};
var start_preload = 0;
var total_model_count = 0;
var load_count = 0;
var webgl_materials = {};

/****************************************************************************
  Preload textures and models
****************************************************************************/
function webgl_preload()
{
  $.blockUI({ message: "<h2>Downloading textures and models...</h2>" });
  start_preload = new Date().getTime();

  var loadingManager = new THREE.LoadingManager();
  loadingManager.onLoad = function () {
    webgl_preload_models();

  };

  var textureLoader = new THREE.ImageLoader( loadingManager );

  /* Preload water overlay texture. */
  if (graphics_quality == QUALITY_LOW) {
    var water_texture = new THREE.Texture();
    webgl_textures["water_overlay"] = water_texture;
    var filename;
    filename = '/textures/small/water_overlay_texture.png';


    textureLoader.load( filename, function ( image ) {
      water_texture.image = image;
      water_texture.wrapS = THREE.RepeatWrapping;
      water_texture.wrapT = THREE.RepeatWrapping;
      water_texture.repeat.set( 5, 5);
      water_texture.needsUpdate = true;
    } );
  }

  /* Preload tree sprite. */
  var tree_sprite = new THREE.Texture();
  webgl_textures["tree_1"] = tree_sprite;
  textureLoader.load( '/textures/tree_1.png', function ( image ) {
      tree_sprite.image = image;
      tree_sprite.needsUpdate = true;
  } );

  var jungle_sprite = new THREE.Texture();
  webgl_textures["jungle_1"] = jungle_sprite;
  textureLoader.load( '/textures/jungle_1.png', function ( image ) {
      jungle_sprite.image = image;
      jungle_sprite.needsUpdate = true;
  } );

  var road_sprite = new THREE.Texture();
  webgl_textures["road_1"] = road_sprite;
  textureLoader.load( '/textures/road_1.png', function ( image ) {
      road_sprite.image = image;
      road_sprite.needsUpdate = true;
      var roadMaterial = new THREE.MeshBasicMaterial( { map: road_sprite, side:THREE.DoubleSide } );
      roadMaterial.transparent = true;
      webgl_materials['road_1'] = roadMaterial;
  } );

  var rail_sprite = new THREE.Texture();
  webgl_textures["rail_1"] = rail_sprite;
  textureLoader.load( '/textures/rail_1.png', function ( image ) {
      rail_sprite.image = image;
      rail_sprite.needsUpdate = true;
      var railMaterial = new THREE.MeshBasicMaterial( { map: rail_sprite, side:THREE.DoubleSide } );
      railMaterial.transparent = true;
      webgl_materials['rail_1'] = railMaterial;
  } );

  var river_sprite = new THREE.Texture();
  webgl_textures["river"] = river_sprite;
  textureLoader.load( '/textures/river.png', function ( image ) {
      river_sprite.image = image;
      river_sprite.needsUpdate = true;
      var riverMaterial = new THREE.MeshBasicMaterial( { map: river_sprite, side:THREE.DoubleSide } );
      riverMaterial.transparent = true;
      webgl_materials['river'] = riverMaterial;
  } );

  if (graphics_quality >= QUALITY_MEDIUM) {
    var waternormals = new THREE.Texture();
    webgl_textures["waternormals"] = waternormals;
    textureLoader.load( '/textures/waternormals.jpg', function ( image ) {
      waternormals.image = image;
      waternormals.needsUpdate = true;
      waternormals.wrapS = waternormals.wrapT = THREE.RepeatWrapping;
    } );


    var sun_texture = new THREE.Texture();
    webgl_textures["run"] = sun_texture;
    textureLoader.load( '/textures/sun.png', function ( image ) {
      sun_texture.image = image;
      sun_texture.needsUpdate = true;
      var sunMaterial = new THREE.MeshBasicMaterial( { map: sun_texture} );
      webgl_materials['sun'] = sunMaterial;
    } );

  }

  /* Preload a texture for each map tile type. */
  for (var i = 0; i < tiletype_terrains.length; i++) {
    var imgurl;
    if (graphics_quality == QUALITY_LOW) imgurl = "/textures/small/" + tiletype_terrains[i] + ".png";
    if (graphics_quality == QUALITY_MEDIUM) imgurl = "/textures/medium/" + tiletype_terrains[i] + ".png";
    if (graphics_quality == QUALITY_HIGH) imgurl = "/textures/large/" + tiletype_terrains[i] + ".png";

    textureLoader.load(imgurl, (function (url, index) {
            return function (image, i) {
                webgl_textures[tiletype_terrains[index]] = new THREE.Texture();
                webgl_textures[tiletype_terrains[index]].image = image;
                webgl_textures[tiletype_terrains[index]].wrapS = THREE.RepeatWrapping;
                webgl_textures[tiletype_terrains[index]].wrapT = THREE.RepeatWrapping;
                if (graphics_quality == QUALITY_LOW) {
                  webgl_textures[tiletype_terrains[index]].magFilter = THREE.NearestFilter;
                  webgl_textures[tiletype_terrains[index]].minFilter = THREE.NearestFilter;
                } else {
                  webgl_textures[tiletype_terrains[index]].magFilter = THREE.LinearFilter;
                  webgl_textures[tiletype_terrains[index]].minFilter = THREE.LinearFilter;
                }

                webgl_textures[tiletype_terrains[index]].needsUpdate = true;
            }
      })(imgurl, i)
    );
  }

}

/****************************************************************************
  Preload all models.
****************************************************************************/
function webgl_preload_models()
{
  var url = '/3d-models/models.zip';
  zip.createReader(new zip.HttpReader(url), function(zipReader){
     $.blockUI({ message: "<h2>Downloading 3D models...</h2>" });
     zipReader.getEntries(function(entries){
       total_model_count = entries.length;
       for (var i = 0; i < entries.length; i++) {
         var file = entries[i];
         handle_zip_file(file['filename'].replace(".dae", ""), file);
       }
     });
  }, function(message){
    swal("Unable to download models. Please reload the page and try again.");
    console.error("Problem downloading models.zip. Error message: " + message);
  });

}

/****************************************************************************
  Handle each unzipped file, call load_model on each file.
****************************************************************************/
function handle_zip_file(filename, file)
{
  file.getData(new zip.TextWriter(), function(text) {
    load_count++;

    webgl_models_xml_strings[filename] = text;
    if (load_count == total_model_count) {
      webgl_preload_complete();
      console.log("WebGL preloading took: " + (new Date().getTime() - start_preload) + " ms.");
    }
  });

}

/****************************************************************************
 Loads a single model file.
****************************************************************************/
function webgl_get_model(filename)
{
  if (webgl_models[filename] != null) return webgl_models[filename].clone();;
  if (webgl_models_xml_strings[filename] == null) {
    return null;
  }

  var colladaloader = new THREE.ColladaLoader();
  colladaloader.options.convertUpAxis = true;

  var collada = colladaloader.parse( webgl_models_xml_strings[filename], null, "/textures/");
  var dae = collada.scene;
  dae.updateMatrix();
  dae.scale.x = dae.scale.y = dae.scale.z = 11;
  webgl_models[filename] = dae;
  webgl_models_xml_strings[filename] = ""; // clear xml string for this model.

  return dae.clone();

}

/****************************************************************************
 Returns a flag mesh
****************************************************************************/
function get_flag_mesh(key)
{
  if (meshes[key] != null) return meshes[key].clone();
  if (sprites[key] == null || key.substring(0,2) != "f.") {
    console.log("Invalid flag key: " + key);
    return null;
  }

  var flagGeometry = new THREE.PlaneBufferGeometry( 14, 10 );
  /* resize flag to 32x16, since that is required by Three.js*/
  var fcanvas = document.createElement("canvas");
  fcanvas.width = 32;
  fcanvas.height = 16;
  var fcontext = fcanvas.getContext("2d");
  fcontext.drawImage(sprites[key], 0, 0,
                sprites[key].width, sprites[key].height,
                0,0,32,16);

  meshes[key] = canvas_to_user_facing_mesh(fcanvas, 32, false)
  return meshes[key].clone();

}

function MarvalColorModelConverter() {}

MarvalColorModelConverter.rgbToBinary = function (img, threshold) {
  var resultImage = new MarvalImage(
    img.getWidth(),
    img.getHeight(),
    MarvalImage.COLOR_MODEL_BINARY
  );

  for (var y = 0; y < img.getHeight(); y++) {
    for (var x = 0; x < img.getWidth(); x++) {
      var gray = Math.ceil(
        img.getIntComponent0(x, y) * 0.3 +
          img.getIntComponent1(x, y) * 0.59 +
          img.getIntComponent2(x, y) * 0.11
      );

      if (gray <= threshold) {
        resultImage.setBinaryColor(x, y, true);
      } else {
        resultImage.setBinaryColor(x, y, false);
      }
    }
  }
  return resultImage;
};

MarvalColorModelConverter.binaryToRgb = function (img) {
  var resultImage = new MarvalImage(
    img.getWidth(),
    img.getHeight(),
    MarvalImage.COLOR_MODEL_RGB
  );

  for (var y = 0; y < img.getHeight(); y++) {
    for (var x = 0; x < img.getWidth(); x++) {
      if (img.getBinaryColor(x, y)) {
        resultImage.setIntColor(x, y, 255, 0, 0, 0);
      } else {
        resultImage.setIntColor(x, y, 255, 255, 255, 255);
      }
    }
  }
  return resultImage;
};

MarvalColorModelConverter.rgbToHsv = function (rgbArray) {
  var hsvArray = new Array(rgbArray.length * 3);

  var red, green, blue;
  for (var i = 0; i < rgbArray.length; i++) {
    red = (rgbArray[i] & 0xff0000) >>> 16;
    green = (rgbArray[i] & 0x00ff00) >>> 8;
    blue = rgbArray[i] & 0x0000ff;

    red /= 255.0;
    green /= 255.0;
    blue /= 255.0;

    var max = Math.max(Math.max(red, green), blue);
    var min = Math.min(Math.min(red, green), blue);
    var c = max - min;

    // H
    var h, s, v;
    if (c != 0) {
      if (max == red) {
        if (green >= blue) {
          h = 60 * ((green - blue) / c);
        } else {
          h = 60 * ((green - blue) / c) + 360;
        }
      } else if (max == green) {
        h = 60 * ((blue - red) / c) + 120;
      } else {
        h = 60 * ((red - green) / c) + 240;
      }
    } else {
      h = 0;
    }

    // V
    v = max;

    // S
    s = c != 0 ? c / v : 0;

    hsvArray[i * 3] = h;
    hsvArray[i * 3 + 1] = s;
    hsvArray[i * 3 + 2] = v;
  }
  return hsvArray;
};

MarvalColorModelConverter.hsvToRgb = function (hsvArray) {
  var rgbArray = new Array(hsvArray.length / 3);

  for (var i = 0, j = 0; i < hsvArray.length; i += 3, j++) {
    var h = hsvArray[i];
    var s = hsvArray[i + 1];
    var v = hsvArray[i + 2];

    // HSV to RGB
    var hi = Math.ceil((h / 60) % 6);
    var f = h / 60 - hi;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    var iHi = Math.ceil(hi);

    var r = 0,
      g = 0,
      b = 0;

    switch (iHi) {
      case 0:
        r = Math.ceil(v * 255);
        g = Math.ceil(t * 255);
        b = Math.ceil(p * 255);
        break;
      case 1:
        r = Math.ceil(q * 255);
        g = Math.ceil(v * 255);
        b = Math.ceil(p * 255);
        break;
      case 2:
        r = Math.ceil(p * 255);
        g = Math.ceil(v * 255);
        b = Math.ceil(t * 255);
        break;
      case 3:
        r = Math.ceil(p * 255);
        g = Math.ceil(q * 255);
        b = Math.ceil(v * 255);
        break;
      case 4:
        r = Math.ceil(t * 255);
        g = Math.ceil(p * 255);
        b = Math.ceil(v * 255);
        break;
      case 5:
        r = Math.ceil(v * 255);
        g = Math.ceil(p * 255);
        b = Math.ceil(q * 255);
        break;
    }

    rgbArray[j] = 0xff000000 + (r << 16) + (g << 8) + b;
  }

  return rgbArray;
};
function MarvalImage(width, height, colorModel) {
  // properties
  this.image = null;
  this.canvas = null;
  this.ctx = null;
  this.data = null;

  if (colorModel == null) {
    this.colorModel = MarvalImage.COLOR_MODEL_RGB;
  } else {
    this.colorModel = colorModel;
  }

  if (width != null) {
    this.create(width, height);
  }

  if (colorModel == MarvalImage.COLOR_MODEL_BINARY) {
    this.arrBinaryColor = new Array(width * height);
  }
}

MarvalImage.COLOR_MODEL_RGB = 0;
MarvalImage.COLOR_MODEL_BINARY = 1;

MarvalImage.prototype.create = function (width, height) {
  this.canvas = document.createElement("canvas");
  this.canvas.width = width;
  this.canvas.height = height;
  this.ctx = this.canvas.getContext("2d");
  this.imageData = this.ctx.getImageData(0, 0, width, height);
  this.width = width;
  this.height = height;
};

MarvalImage.prototype.setDimension = function (width, height) {
  this.create(width, height);
};

MarvalImage.prototype.load = function (url, callback) {
  this.onload = callback;
  this.image = new Image();
  var ref = this;
  this.image.onload = function () {
    ref.callbackImageLoaded(ref);
  };
  this.image.crossOrigin = "anonymous";
  this.image.src = url;
};

// WARN: the callback "this" object is the reference to js Image object.
MarvalImage.prototype.callbackImageLoaded = function (marvalImage) {
  marvalImage.width = marvalImage.image.width;
  marvalImage.height = marvalImage.image.height;
  marvalImage.canvas = document.createElement("canvas");
  marvalImage.canvas.width = marvalImage.image.width;
  marvalImage.canvas.height = marvalImage.image.height;

  marvalImage.ctx = marvalImage.canvas.getContext("2d");
  marvalImage.ctx.drawImage(marvalImage.image, 0, 0);

  this.imageData = marvalImage.ctx.getImageData(
    0,
    0,
    marvalImage.getWidth(),
    marvalImage.getHeight()
  );

  if (marvalImage.onload != null) {
    marvalImage.onload();
  }
};

MarvalImage.prototype.clone = function () {
  var image = new MarvalImage(
    this.getWidth(),
    this.getHeight(),
    this.colorModel
  );
  MarvalImage.copyColorArray(this, image);
  return image;
};

MarvalImage.prototype.update = function (color) {
  this.canvas.getContext("2d").putImageData(this.imageData, 0, 0);
};

MarvalImage.prototype.clear = function (color) {
  for (var y = 0; y < this.getHeight(); y++) {
    for (var x = 0; x < this.getWidth(); x++) {
      this.setIntColor(x, y, color);
    }
  }
};

MarvalImage.prototype.getColorModel = function () {
  return this.colorModel;
};

MarvalImage.prototype.getAlphaComponent = function (x, y) {
  var start = (y * this.getWidth() + x) * 4;
  return this.imageData.data[start + 3];
};

MarvalImage.prototype.setAlphaComponent = function (x, y, alpha) {
  var start = (y * this.getWidth() + x) * 4;
  this.imageData.data[start + 3] = alpha;
};

MarvalImage.prototype.getIntComponent0 = function (x, y) {
  var start = (y * this.getWidth() + x) * 4;
  return this.imageData.data[start];
};

MarvalImage.prototype.getIntComponent1 = function (x, y) {
  var start = (y * this.getWidth() + x) * 4;
  return this.imageData.data[start + 1];
};

MarvalImage.prototype.getIntComponent2 = function (x, y) {
  var start = (y * this.getWidth() + x) * 4;
  return this.imageData.data[start + 2];
};

MarvalImage.prototype.setIntColor = function (x, y, a1, a2, a3, a4) {
  if (a2 == null) {
    this.setIntColor1(x, y, a1);
  } else if (a3 == null && a4 == null) {
    this.setIntColor2(x, y, a1, a2);
  } else if (a4 == null) {
    this.setIntColor3(x, y, a1, a2, a3);
  } else {
    this.setIntColor4(x, y, a1, a2, a3, a4);
  }
};

MarvalImage.prototype.getIntColor = function (x, y) {
  var start = (y * this.getWidth() + x) * 4;

  return (
    0x100000000 +
    (this.imageData.data[start + 3] << 24) +
    (this.imageData.data[start] << 16) +
    (this.imageData.data[start + 1] << 8) +
    this.imageData.data[start + 2]
  );
};

MarvalImage.prototype.setIntColor1 = function (x, y, color) {
  var a = (color & 0xff000000) >>> 24;
  var r = (color & 0x00ff0000) >> 16;
  var g = (color & 0x0000ff00) >> 8;
  var b = color & 0x000000ff;
  this.setIntColor4(x, y, a, r, g, b);
};

MarvalImage.prototype.setBinaryColor = function (x, y, value) {
  var pos = y * this.getWidth() + x;
  this.arrBinaryColor[pos] = value;
};

MarvalImage.prototype.getBinaryColor = function (x, y) {
  var pos = y * this.getWidth() + x;
  return this.arrBinaryColor[pos];
};

MarvalImage.copyColorArray = function (imgSource, imgDestine) {
  if (imgSource.getColorModel() == imgDestine.getColorModel()) {
    switch (imgSource.getColorModel()) {
      case MarvalImage.COLOR_MODEL_RGB:
        for (var i = 0; i < imgSource.imageData.data.length; i++) {
          imgDestine.imageData.data[i] = imgSource.imageData.data[i];
        }
        break;
      case MarvalImage.COLOR_MODEL_BINARY:
        for (var i = 0; i < imgSource.arrBinaryColor.length; i++) {
          imgDestine.arrBinaryColor[i] = imgSource.arrBinaryColor[i];
        }
        break;
    }
  }
};

MarvalImage.prototype.drawRect = function (x, y, width, height, color) {
  for (var i = x; i < x + width; i++) {
    this.setIntColor(i, y, color);
    this.setIntColor(i, y + (height - 1), color);
  }

  for (var i = y; i < y + height; i++) {
    this.setIntColor(x, i, color);
    this.setIntColor(x + (width - 1), i, color);
  }
};

MarvalImage.prototype.fillRect = function (x, y, width, height, color) {
  for (var i = x; i < x + width; i++) {
    for (var j = y; j < y + height; j++) {
      if (i < this.getWidth() && j < this.getHeight()) {
        this.setIntColor(i, j, color);
      }
    }
  }
};

MarvalImage.prototype.setColorToAlpha = function (color, alpha) {
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      if ((this.getIntColor(x, y) & 0x00ffffff) == (color & 0x00ffffff)) {
        this.setAlphaComponent(x, y, alpha);
      }
    }
  }
};

MarvalImage.prototype.setAlphaToColor = function (color) {
  for (var y = 0; y < this.height; y++) {
    for (var x = 0; x < this.width; x++) {
      if (this.getAlphaComponent(x, y) == 0) {
        this.setIntColor(x, y, 0xffffffff);
      }
    }
  }
};

MarvalImage.prototype.setIntColor2 = function (x, y, alpha, color) {
  var r = (color & 0x00ff0000) >> 16;
  var g = (color & 0x0000ff00) >> 8;
  var b = color & 0x000000ff;
  this.setIntColor4(x, y, alpha, r, g, b);
};

MarvalImage.prototype.setIntColor3 = function (x, y, r, g, b) {
  this.setIntColor4(x, y, 255, r, g, b);
};

MarvalImage.prototype.setIntColor4 = function (x, y, alpha, r, g, b) {
  var start = (y * this.getWidth() + x) * 4;
  this.imageData.data[start] = r;
  this.imageData.data[start + 1] = g;
  this.imageData.data[start + 2] = b;
  this.imageData.data[start + 3] = alpha;
};

MarvalImage.prototype.getWidth = function () {
  return this.width;
};

MarvalImage.prototype.getHeight = function () {
  return this.height;
};

MarvalImage.prototype.isValidPosition = function (x, y) {
  if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
    return true;
  }
  return false;
};

MarvalImage.prototype.draw = function (canvas, x, y, alphaCombination) {
  if (x == null) {
    x = 0;
  }
  if (y == null) {
    y = 0;
  }
  canvas.getContext("2d").putImageData(this.imageData, x, y); /*
	if(alphaCombination == null || !alphaCombination){
		canvas.getContext("2d").putImageData(this.imageData, x,y);
	} else{
		this.imageData = this.ctx.getImageData(0, 0, width, height);
		var c = document.createElement('canvas');
		c.width = this.width;
		c.height = this.height;
		c.getContext('2d').putImageData(this.imageData,x,y); 
		var img = new Image();
		img.src = c.toDataURL();
		canvas.getContext("2d").drawImage(img, x, y);
	}*/
};

MarvalImage.prototype.toBlob = function () {
  this.update();
  return MarvalImage.dataURItoBlob(this.canvas.toDataURL("image/png"));
};

MarvalImage.dataURItoBlob = function (dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  var byteString;
  if (dataURI.split(",")[0].indexOf("base64") >= 0)
    byteString = atob(dataURI.split(",")[1]);
  else byteString = unescape(dataURI.split(",")[1]);

  // separate out the mime component
  var mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], { type: mimeString });
};

function MarvalImageMask(w, h) {
  this.width = w;
  this.height = h;

  if (w != 0 && h != 0) {
    this.arrMask = MarvalJSUtils.createMatrix2D(width, height);
  } else {
    this.arrMask = null;
  }
}

MarvalImageMask.prototype.getWidth = function () {
  return this.width;
};

MarvalImageMask.prototype.getHeight = function () {
  return this.height;
};

MarvalImageMask.prototype.addPixel = function (x, y) {
  this.arrMask[x][y] = true;
};

MarvalImageMask.prototype.removePixel = function (x, y) {
  this.arrMask[x][y] = false;
};

MarvalImageMask.prototype.clear = function () {
  if (this.arrMask != null) {
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        this.arrMask[x][y] = false;
      }
    }
  }
};

MarvalImageMask.prototype.getMask = function () {
  return this.arrMask;
};

MarvalImageMask.prototype.addRectRegion = function (
  startX,
  startY,
  regionWidth,
  regionHeight
) {
  for (var x = startX; x < startX + regionWidth; x++) {
    for (var y = startY; y < startY + regionHeight; y++) {
      this.arrMask[x][y] = true;
    }
  }
};

MarvalImageMask.createNullMask = function () {
  return new MarvalImageMask(0, 0);
};

MarvalImageMask.NULL_MASK = MarvalImageMask.createNullMask();

function MarvalSegment(x1, y1, x2, y2) {
  this.x1 = x1;
  this.x2 = x2;
  this.y1 = y1;
  this.y2 = y2;

  if (x1 != -1 && y1 != -1 && x2 != -1 && y2 != -1) {
    this.width = x2 - x1 + 1;
    this.height = y2 - y1 + 1;
    this.area = this.width * this.height;
  }
}

MarvalSegment.segmentMinDistance = function (segments, minDistance) {
  var s1, s2;
  for (var i = 0; i < segments.size() - 1; i++) {
    for (var j = i + 1; j < segments.size(); j++) {
      s1 = segments[i];
      s2 = segments[j];

      if (
        MarvalMath.euclidianDistance(
          (s1.x1 + s1.x2) / 2,
          (s1.y1 + s1.y2) / 2,
          (s2.x1 + s2.x2) / 2,
          (s2.y1 + s2.y2) / 2
        ) < minDistance
      ) {
        segments.splice(j, 1);
        j--;
      }
    }
  }
};

function MarvalColor(red, green, blue) {
  this.red = red;
  this.green = green;
  this.blue = blue;
  return this;
}

MarvalColor.prototype.setId = function (id) {
  this.id = id;
};

MarvalColor.prototype.getId = function () {
  return this.id;
};

MarvalColor.prototype.setName = function (name) {
  this.name = name;
};

MarvalColor.prototype.getName = function () {
  return this.name;
};
var MarvalJSUtils = new Object();

MarvalJSUtils.createMatrix2D = function (rows, cols, value) {
  var arr = new Array(rows);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = new Array(cols);
    arr[i].fill(value);
  }
  return arr;
};

MarvalJSUtils.createMatrix3D = function (rows, cols, depth, value) {
  var arr = new Array(rows);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = new Array(cols);
    for (var j = 0; j < arr[i].length; j++) {
      arr[i][j] = new Array(depth);
      arr[i][j].fill(value);
    }
  }
  return arr;
};

MarvalJSUtils.createMatrix4D = function (rows, cols, depth, another, value) {
  var arr = new Array(rows);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = new Array(cols);
    for (var j = 0; j < arr[i].length; j++) {
      arr[i][j] = new Array(depth);
      for (var w = 0; w < arr[i][j].length; w++) {
        arr[i][j][w] = new Array(another);
        arr[i][j][w].fill(value);
      }
    }
  }
  return arr;
};
var MarvalMath = new Object();

MarvalMath.getTrueMatrix = function (rows, cols) {
  var ret = MarvalJSUtils.createMatrix2D(rows, cols);

  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
      ret[i][j] = true;
    }
  }
  return ret;
};

MarvalMath.scaleMatrix = function (matrix, scale) {
  var ret = MarvalJSUtils.createMatrix2D(matrix.length, matrix.length);

  for (var i = 0; i < matrix.length; i++) {
    for (var j = 0; j < matrix.length; j++) {
      ret[i][j] = matrix[i][j] * scale;
    }
  }
  return ret;
};

MarvalMath.euclideanDistance = function (p1, p2, p3, p4, p5, p6) {
  if (p6 != null) {
    return MarvalMath.euclideanDistance3D(p1, p2, p3, p4, p5, p6);
  } else {
    return MarvalMath.euclideanDistance3D(p1, p2, p3, p4);
  }
};

MarvalMath.euclideanDistance2D = function (x1, y1, x2, y2) {
  var dx = x1 - x2;
  var dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
};

MarvalMath.euclideanDistance3D = function (x1, y1, z1, x2, y2, z2) {
  var dx = x1 - x2;
  var dy = y1 - y2;
  var dz = z1 - z2;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

function DetermineFixedCameraBackground() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

DetermineFixedCameraBackground.prototype.load = function () {
  this.initialized = false;
};

DetermineFixedCameraBackground.prototype.initialize = function (imageIn) {
  this.weights = this.weights = MarvalJSUtils.createMatrix4D(
    imageIn.getWidth(),
    imageIn.getHeight(),
    3,
    26,
    0
  );
  initialized = true;
};

DetermineFixedCameraBackground.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  if (!this.initialized) {
    this.initialize(imageIn);
  }

  for (var y = 0; y < imageIn.getHeight(); y++) {
    for (var x = 0; x < imageIn.getWidth(); x++) {
      var red = imageIn.getIntComponent0(x, y);
      var green = imageIn.getIntComponent1(x, y);
      var blue = imageIn.getIntComponent2(x, y);

      weights[x][y][0][red / 10]++;
      weights[x][y][1][green / 10]++;
      weights[x][y][2][blue / 10]++;

      imageOut.setIntColor(
        x,
        y,
        255,
        this.getProbableColor(weights[x][y][0]),
        this.getProbableColor(weights[x][y][1]),
        this.getProbableColor(weights[x][y][2])
      );
    }
  }
};

DetermineFixedCameraBackground.prototype.getProbableColor = function (arr) {
  var max = -1;
  var maxIndex = 0;

  for (var i = 0; i < arr.length; i++) {
    if (max == -1 || arr[i] > max) {
      max = arr[i];
      maxIndex = i;
    }
  }

  return maxIndex * 10;
};

function DetermineSceneBackground() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

DetermineSceneBackground.prototype.load = function () {
  this.setAttribute("threshold", 30);
};

DetermineSceneBackground.prototype.process = function (images, imageOut) {
  var threshold = this.getAttribute("threshold");
  var image0 = images[0];
  for (var y = 0; y < image0.getHeight(); y++) {
    for (var x = 0; x < image0.getWidth(); x++) {
      imageOut.setIntColor(
        x,
        y,
        this.getBackgroundPixel(x, y, images, threshold)
      );
    }
  }
};

DetermineSceneBackground.prototype.getBackgroundPixel = function (
  x,
  y,
  images,
  threshold
) {
  var colors = new Array();
  for (var i in images) {
    var img = images[i];
    var c = new Array(4);
    c[0] = img.getIntComponent0(x, y);
    c[1] = img.getIntComponent1(x, y);
    c[2] = img.getIntComponent2(x, y);
    c[3] = 0;

    if (colors.length == 0) {
      colors.push(c);
    } else {
      var found = false;
      for (var j in colors) {
        var c2 = colors[j];
        if (
          Math.abs(c2[0] - c[0]) < threshold * 0.3 &&
          Math.abs(c2[1] - c[1]) < threshold * 0.3 &&
          Math.abs(c2[2] - c[2]) < threshold * 0.3
        ) {
          c2[0] = Math.floor((c2[0] + c[0]) / 2);
          c2[1] = Math.floor((c2[1] + c[1]) / 2);
          c2[2] = Math.floor((c2[2] + c[2]) / 2);
          c2[3]++;
          found = true;
          break;
        }
      }

      if (!found) {
        colors.push(c);
      }
    }
  }

  var max = -1;
  var maxIndex = 0;
  var c2 = null;
  for (var i = 0; i < colors.length; i++) {
    c2 = colors[i];
    if (max == -1 || c2[3] > max) {
      max = c2[3];
      maxIndex = i;
    }
  }
  c2 = colors[maxIndex];
  return 0xff000000 + (c2[0] << 16) + (c2[1] << 8) + c2[2];
};

function GaussianBlur() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

GaussianBlur.prototype.load = function () {
  this.RED = 0;
  this.GREEN = 1;
  this.BLUE = 2;

  this.kernelMatrix = null;
  this.resultMatrix = null;
  this.appiledkernelMatrix = null;
  this.radius = null;

  this.setAttribute("radius", 3);
};

GaussianBlur.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  this.radius = this.getAttribute("radius");

  var l_imageWidth = imageIn.getWidth();
  var l_imageHeight = imageIn.getHeight();

  var l_pixelColor;
  this.kernelMatrix = this.getGaussianKernel();
  this.resultMatrix = MarvalJSUtils.createMatrix3D(
    l_imageWidth,
    l_imageHeight,
    3,
    0
  );
  this.appiledkernelMatrix = MarvalJSUtils.createMatrix2D(
    l_imageWidth,
    l_imageHeight,
    0
  );

  var l_arrMask = mask.getMask();

  for (var x = 0; x < l_imageWidth; x++) {
    for (var y = 0; y < l_imageHeight; y++) {
      if (l_arrMask != null && !l_arrMask[x][y]) {
        continue;
      }
      l_pixelColor = imageIn.getIntColor(x, y);
      this.applyKernel(x, y, l_pixelColor, imageOut);
    }
  }

  for (var x = 0; x < l_imageWidth; x++) {
    for (var y = 0; y < l_imageHeight; y++) {
      if (l_arrMask != null && !l_arrMask[x][y]) {
        continue;
      }
      this.resultMatrix[x][y][this.RED] =
        (this.resultMatrix[x][y][0] / this.appiledkernelMatrix[x][y]) % 256;
      this.resultMatrix[x][y][this.GREEN] =
        (this.resultMatrix[x][y][1] / this.appiledkernelMatrix[x][y]) % 256;
      this.resultMatrix[x][y][this.BLUE] =
        (this.resultMatrix[x][y][2] / this.appiledkernelMatrix[x][y]) % 256;
      imageOut.setIntColor(
        x,
        y,
        imageIn.getAlphaComponent(x, y),
        Math.floor(this.resultMatrix[x][y][0]),
        Math.floor(this.resultMatrix[x][y][1]),
        Math.floor(this.resultMatrix[x][y][2])
      );
    }
  }
};

/*
 * Calc Gaussian Matrix.
 */
GaussianBlur.prototype.getGaussianKernel = function () {
  var l_matrix = MarvalJSUtils.createMatrix2D(
    this.radius * 2 + 1,
    this.radius * 2 + 1
  );
  var l_q = this.radius / 3.0;
  var l_distance;
  var l_x;
  var l_y;

  for (var x = 1; x <= this.radius * 2 + 1; x++) {
    for (var y = 1; y <= this.radius * 2 + 1; y++) {
      l_x = Math.abs(x - (this.radius + 1));
      l_y = Math.abs(y - (this.radius + 1));
      l_distance = Math.sqrt(l_x * l_x + l_y * l_y);
      l_matrix[y - 1][x - 1] =
        (1.0 / (2.0 * Math.PI * l_q * l_q)) *
        Math.exp(-(l_distance * l_distance) / (2.0 * l_q * l_q));
    }
  }
  return l_matrix;
};

/*
 * Apply the blur matrix on a image region.
 */
GaussianBlur.prototype.applyKernel = function (
  centerPixel_X,
  centerPixel_Y,
  pixelColor,
  image
) {
  for (var y = centerPixel_Y; y < centerPixel_Y + this.radius * 2; y++) {
    for (var x = centerPixel_X; x < centerPixel_X + this.radius * 2; x++) {
      if (
        x - this.radius >= 0 &&
        x - this.radius < image.getWidth() &&
        y - this.radius >= 0 &&
        y - this.radius < image.getHeight()
      ) {
        this.resultMatrix[x - this.radius][y - this.radius][this.RED] +=
          ((pixelColor & 0x00ff0000) >>> 16) *
          this.kernelMatrix[x - centerPixel_X][y - centerPixel_Y];
        this.resultMatrix[x - this.radius][y - this.radius][this.GREEN] +=
          ((pixelColor & 0x0000ff00) >>> 8) *
          this.kernelMatrix[x - centerPixel_X][y - centerPixel_Y];
        this.resultMatrix[x - this.radius][y - this.radius][this.BLUE] +=
          (pixelColor & 0x000000ff) *
          this.kernelMatrix[x - centerPixel_X][y - centerPixel_Y];
        this.appiledkernelMatrix[x - this.radius][y - this.radius] +=
          this.kernelMatrix[x - centerPixel_X][y - centerPixel_Y];
      }
    }
  }
};
function AlphaBoundary() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

AlphaBoundary.prototype.load = function () {
  this.setAttribute("radius", 5);
};

AlphaBoundary.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  var neighborhood = this.getAttribute("radius");
  for (var y = 0; y < imageOut.getHeight(); y++) {
    for (var x = 0; x < imageOut.getWidth(); x++) {
      this.alphaRadius(imageOut, x, y, neighborhood);
    }
  }
};

AlphaBoundary.prototype.alphaRadius = function (image, x, y, radius) {
  var oldAlpha = image.getAlphaComponent(x, y);
  var newAlpha;
  var totalAlpha = 0;
  var totalPixels = 0;
  var hn = Math.floor(radius / 2);

  for (var j = y - hn; j < y + hn; j++) {
    for (var i = x - hn; i < x + hn; i++) {
      if (i >= 0 && i < image.getWidth() && j >= 0 && j < image.getHeight()) {
        totalAlpha += image.getAlphaComponent(i, j);
        totalPixels++;
      }
    }
  }

  newAlpha = Math.floor(totalAlpha / totalPixels);

  if (newAlpha < oldAlpha) image.setAlphaComponent(x, y, newAlpha);
};

function AverageColor() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

AverageColor.prototype.load = function () {};

AverageColor.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  var totalR = 0;
  var totalG = 0;
  var totalB = 0;

  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      totalR += imageIn.getIntComponent0(x, y);
      totalG += imageIn.getIntComponent1(x, y);
      totalB += imageIn.getIntComponent2(x, y);
    }
  }

  var totalPixels = imageIn.getWidth() * imageIn.getHeight();
  totalR = Math.round(totalR / totalPixels);
  totalG = Math.round(totalG / totalPixels);
  totalB = Math.round(totalB / totalPixels);

  if (attributesOut != null) {
    attributesOut.set("averageColor", [totalR, totalG, totalB]);
  }
};

function BlackAndWhite() {
  MarvalAbstractImagePlugin.super(this);
  this.MAX_RLEVEL = 0.03;
  this.load();
}

BlackAndWhite.prototype.load = function () {
  this.grayScale = new GrayScale();
  this.setAttribute("level", 10);
};

BlackAndWhite.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  this.grayScale.process(imageIn, imageOut);
  var level = this.getAttribute("level");
  var rlevel = (level / 100.0) * this.MAX_RLEVEL;

  var c = 0;
  var gray;
  for (var y = 0; y < imageOut.getHeight(); y++) {
    for (var x = 0; x < imageOut.getWidth(); x++) {
      gray = imageIn.getIntComponent0(x, y);

      if (gray <= 127) {
        gray = Math.max(gray * (1 - (127 - gray) * rlevel), 0);
      } else {
        gray = Math.min(gray * (1 + (gray - 127) * rlevel), 255);
      }

      if (c++ < 1) {
        console.log("gray:" + gray);
        console.log("level:" + level);
        console.log("rlevel:" + rlevel);
      }

      imageOut.setIntColor(
        x,
        y,
        255,
        Math.floor(gray),
        Math.floor(gray),
        Math.floor(gray)
      );
    }
  }
};

function BrightnessAndContrast() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

BrightnessAndContrast.prototype.load = function () {
  // Attributes
  this.setAttribute("brightness", 0);
  this.setAttribute("contrast", 0);
};

BrightnessAndContrast.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  var r, g, b;
  var l_brightness = this.getAttribute("brightness");
  var l_contrast = this.getAttribute("contrast");
  l_contrast = Math.pow((127 + l_contrast) / 127, 2);

  // Brightness
  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      r = imageIn.getIntComponent0(x, y);
      g = imageIn.getIntComponent1(x, y);
      b = imageIn.getIntComponent2(x, y);

      r += (1 - r / 255) * l_brightness;
      g += (1 - g / 255) * l_brightness;
      b += (1 - b / 255) * l_brightness;
      if (r < 0) r = 0;
      if (r > 255) r = 255;
      if (g < 0) g = 0;
      if (g > 255) g = 255;
      if (b < 0) b = 0;
      if (b > 255) b = 255;

      imageOut.setIntColor(
        x,
        y,
        imageIn.getAlphaComponent(x, y),
        Math.floor(r),
        Math.floor(g),
        Math.floor(b)
      );
    }
  }

  // Contrast
  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      r = imageOut.getIntComponent0(x, y);
      g = imageOut.getIntComponent1(x, y);
      b = imageOut.getIntComponent2(x, y);

      r /= 255.0;
      r -= 0.5;
      r *= l_contrast;
      r += 0.5;
      r *= 255.0;

      g /= 255.0;
      g -= 0.5;
      g *= l_contrast;
      g += 0.5;
      g *= 255.0;

      b /= 255.0;
      b -= 0.5;
      b *= l_contrast;
      b += 0.5;
      b *= 255.0;

      if (r < 0) r = 0;
      if (r > 255) r = 255;
      if (g < 0) g = 0;
      if (g > 255) g = 255;
      if (b < 0) b = 0;
      if (b > 255) b = 255;

      imageOut.setIntColor(
        x,
        y,
        imageIn.getAlphaComponent(x, y),
        Math.floor(r),
        Math.floor(g),
        Math.floor(b)
      );
    }
  }
};

function ColorChannel() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

ColorChannel.prototype.load = function () {
  this.setAttribute("red", 0);
  this.setAttribute("green", 0);
  this.setAttribute("blue", 0);
};

ColorChannel.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  var vr = this.getAttribute("red");
  var vg = this.getAttribute("green");
  var vb = this.getAttribute("blue");

  var mr = 1 + Math.abs((vr / 100.0) * 2.5);
  var mg = 1 + Math.abs((vg / 100.0) * 2.5);
  var mb = 1 + Math.abs((vb / 100.0) * 2.5);

  mr = vr > 0 ? mr : 1.0 / mr;
  mg = vg > 0 ? mg : 1.0 / mg;
  mb = vb > 0 ? mb : 1.0 / mb;

  var red, green, blue;
  for (var y = 0; y < imageIn.getHeight(); y++) {
    for (var x = 0; x < imageIn.getWidth(); x++) {
      red = imageIn.getIntComponent0(x, y);
      green = imageIn.getIntComponent1(x, y);
      blue = imageIn.getIntComponent2(x, y);

      red = Math.min(red * mr, 255);
      green = Math.min(green * mg, 255);
      blue = Math.min(blue * mb, 255);

      imageOut.setIntColor(x, y, 255, red, green, blue);
    }
  }
};

function Emboss() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

Emboss.prototype.load = function () {};

Emboss.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  var l_arrMask = mask.getMask();

  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      if (l_arrMask != null && !l_arrMask[x][y]) {
        imageOut.setIntColor(x, y, 255, imageIn.getIntColor(x, y));
        continue;
      }

      var rDiff = 0;
      var gDiff = 0;
      var bDiff = 0;

      if (y > 0 && x > 0) {
        // Red component difference between the current and the upperleft pixels
        rDiff =
          imageIn.getIntComponent0(x, y) -
          imageIn.getIntComponent0(x - 1, y - 1);

        // Green component difference between the current and the upperleft pixels
        gDiff =
          imageIn.getIntComponent1(x, y) -
          imageIn.getIntComponent1(x - 1, y - 1);

        // Blue component difference between the current and the upperleft pixels
        bDiff =
          imageIn.getIntComponent2(x, y) -
          imageIn.getIntComponent2(x - 1, y - 1);
      } else {
        rDiff = 0;
        gDiff = 0;
        bDiff = 0;
      }

      var diff = rDiff;
      if (Math.abs(gDiff) > Math.abs(diff)) diff = gDiff;
      if (Math.abs(bDiff) > Math.abs(diff)) diff = bDiff;

      var grayLevel = Math.max(Math.min(128 + diff, 255), 0);

      imageOut.setIntColor(x, y, 255, grayLevel, grayLevel, grayLevel);
    }
  }
};

function GrayScale() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

GrayScale.prototype.load = function () {};

GrayScale.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  // Mask
  var l_arrMask;
  if (mask != null) {
    l_arrMask = mask.getMask();
  }

  var r, g, b, finalColor;
  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      if (l_arrMask != null && !l_arrMask[x][y]) {
        continue;
      }
      //Red - 30% / Green - 59% / Blue - 11%
      r = imageIn.getIntComponent0(x, y);
      g = imageIn.getIntComponent1(x, y);
      b = imageIn.getIntComponent2(x, y);
      finalColor = Math.ceil(r * 0.3 + g * 0.59 + b * 0.11);
      imageOut.setIntColor(
        x,
        y,
        imageIn.getAlphaComponent(x, y),
        finalColor,
        finalColor,
        finalColor
      );
    }
  }
};

function Invert() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

Invert.prototype.load = function () {};

Invert.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  var l_arrMask = mask.getMask();

  var r, g, b;
  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      if (l_arrMask != null && !l_arrMask[x][y]) {
        continue;
      }
      r = 255 - imageIn.getIntComponent0(x, y);
      g = 255 - imageIn.getIntComponent1(x, y);
      b = 255 - imageIn.getIntComponent2(x, y);

      imageOut.setIntColor(x, y, imageIn.getAlphaComponent(x, y), r, g, b);
    }
  }
};

function ColorNoise() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

ColorNoise.prototype.load = function () {};

ColorNoise.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  noiseWeight = this.getAttribute("intensity");
  imageWeight = 1 - noiseWeight;
  var l_arrMask = mask.getMask();

  var r, g, b;
  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      if (l_arrMask != null && !l_arrMask[x][y]) {
        continue;
      }
      r =
        Math.random() * 255 * noiseWeight +
        imageIn.getIntComponent0(x, y) * imageWeight;
      g =
        Math.random() * 255 * noiseWeight +
        imageIn.getIntComponent1(x, y) * imageWeight;
      b =
        Math.random() * 255 * noiseWeight +
        imageIn.getIntComponent2(x, y) * imageWeight;

      imageOut.setIntColor(x, y, imageIn.getAlphaComponent(x, y), r, g, b);
    }
  }
};

function BlackAndWhiteNoise() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

BlackAndWhiteNoise.prototype.load = function () {};

BlackAndWhiteNoise.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  noiseWeight = this.getAttribute("intensity");
  imageWeight = 1 - noiseWeight;
  var l_arrMask = mask.getMask();

  var r, g, b, noise;
  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      if (l_arrMask != null && !l_arrMask[x][y]) {
        continue;
      }
      noise = Math.random() * 255 * noiseWeight;
      r = noise + imageIn.getIntComponent0(x, y) * imageWeight;
      g = noise + imageIn.getIntComponent1(x, y) * imageWeight;
      b = noise + imageIn.getIntComponent2(x, y) * imageWeight;

      imageOut.setIntColor(x, y, imageIn.getAlphaComponent(x, y), r, g, b);
    }
  }
};

function HorizontalScanLines() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

HorizontalScanLines.prototype.load = function () {};

HorizontalScanLines.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  intensity = this.getAttribute("intensity");
  var l_arrMask = mask.getMask();

  var r, g, b;
  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y += 2) {
      if (l_arrMask != null && !l_arrMask[x][y]) {
        continue;
      }
      r = imageIn.getIntComponent0(x, y) - intensity;
      g = imageIn.getIntComponent1(x, y) - intensity;
      b = imageIn.getIntComponent2(x, y) - intensity;

      imageOut.setIntColor(x, y, imageIn.getAlphaComponent(x, y), r, g, b);
      if (y + 2 > imageIn.getHeight()) {
        break;
      }
    }
  }
};

function VerticalScanLines() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

VerticalScanLines.prototype.load = function () {};

VerticalScanLines.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  intensity = this.getAttribute("intensity");
  var l_arrMask = mask.getMask();

  var r, g, b;
  for (var y = 0; y < imageIn.getHeight(); y++) {
    for (var x = 0; x < imageIn.getWidth(); x += 2) {
      if (l_arrMask != null && !l_arrMask[x][y]) {
        continue;
      }
      r = imageIn.getIntComponent0(x, y) - intensity;
      g = imageIn.getIntComponent1(x, y) - intensity;
      b = imageIn.getIntComponent2(x, y) - intensity;

      imageOut.setIntColor(x, y, imageIn.getAlphaComponent(x, y), r, g, b);
      if (x + 2 > imageIn.getWidth()) {
        break;
      }
    }
  }
};

function ColorSort() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

ColorSort.prototype.load = function () {};

ColorSort.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  weighted = this.getAttribute("weighted");
  var r, g, b, brightness;
  var joinedColors = [];
  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      r = imageIn.getIntComponent0(x, y);
      g = imageIn.getIntComponent1(x, y);
      b = imageIn.getIntComponent2(x, y);
      brightness = weighted ? r * 0.3 + g * 0.59 + b * 0.11 : r + b + g;
      joinedColors.push({ r: r, g: g, b: b, brightness: brightness });
    }
  }

  // Sort the colors based on brightness (from darkest to lightest)
  joinedColors.sort(function (a, b) {
    return a.brightness - b.brightness;
  });

  var jCIndex = 0;
  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      r = joinedColors[jCIndex].r;
      g = joinedColors[jCIndex].g;
      b = joinedColors[jCIndex].b;
      jCIndex++;
      imageOut.setIntColor(x, y, imageIn.getAlphaComponent(x, y), r, g, b);
    }
  }
};

function Sepia() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

Sepia.prototype.load = function () {
  this.setAttribute("txtValue", "20");
  this.setAttribute("intensity", 20);
};

Sepia.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  var r, g, b, depth, corfinal;

  //Define a intensidade do filtro...
  depth = this.getAttribute("intensity");

  var width = imageIn.getWidth();
  var height = imageIn.getHeight();

  var l_arrMask = mask.getMask();

  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      if (l_arrMask != null && !l_arrMask[x][y]) {
        continue;
      }
      //Captura o RGB do ponto...
      r = imageIn.getIntComponent0(x, y);
      g = imageIn.getIntComponent1(x, y);
      b = imageIn.getIntComponent2(x, y);

      //Define a cor como a m�dia aritm�tica do pixel...
      corfinal = (r + g + b) / 3;
      r = g = b = corfinal;

      r = this.truncate(r + depth * 2);
      g = this.truncate(g + depth);

      //Define a nova cor do ponto...
      imageOut.setIntColor(x, y, imageIn.getAlphaComponent(x, y), r, g, b);
    }
  }
};

/**
 * Sets the RGB between 0 and 255
 * @param a
 * @return
 */
Sepia.prototype.truncate = function (a) {
  if (a < 0) return 0;
  else if (a > 255) return 255;
  else return a;
};

function Thresholding() {
  MarvalAbstractImagePlugin.super(this);
  this.load();

  this.threshold = null;
  this.thresholdRange = null;
  this.neighborhood = null;
  this.range = null;
}

Thresholding.prototype.load = function () {
  // Attributes
  this.setAttribute("threshold", 125);
  this.setAttribute("thresholdRange", -1);
  this.setAttribute("neighborhood", -1);
  this.setAttribute("range", -1);

  this.pluginGray = new GrayScale();
};

Thresholding.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  this.threshold = this.getAttribute("threshold");
  this.thresholdRange = this.getAttribute("thresholdRange");
  this.neighborhood = this.getAttribute("neighborhood");
  this.range = this.getAttribute("range");

  if (this.thresholdRange == -1) {
    this.thresholdRange = 255 - threshold;
  }

  this.pluginGray.process(imageIn, imageOut, attributesOut, mask, previewMode);

  var bmask = mask.getMask();

  if (this.neighborhood == -1 && this.range == -1) {
    this.hardThreshold(imageIn, imageOut, bmask);
  } else {
    this.contrastThreshold(imageIn, imageOut);
  }
};

Thresholding.prototype.hardThreshold = function (imageIn, imageOut, mask) {
  for (var y = 0; y < imageIn.getHeight(); y++) {
    for (var x = 0; x < imageIn.getWidth(); x++) {
      if (mask != null && !mask[x][y]) {
        continue;
      }

      var gray = imageIn.getIntComponent0(x, y);
      if (
        gray < this.threshold ||
        gray > this.threshold + this.thresholdRange
      ) {
        imageOut.setIntColor(x, y, imageIn.getAlphaComponent(x, y), 0, 0, 0);
      } else {
        imageOut.setIntColor(
          x,
          y,
          imageIn.getAlphaComponent(x, y),
          255,
          255,
          255
        );
      }
    }
  }
};

Thresholding.prototype.contrastThreshold = function (imageIn, imageOut) {
  this.range = 1;
  for (var x = 0; x < imageIn.getWidth(); x++) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      if (checkNeighbors(x, y, neighborhood, neighborhood, imageIn)) {
        imageOut.setIntColor(x, y, 0, 0, 0);
      } else {
        imageOut.setIntColor(x, y, 255, 255, 255);
      }
    }
  }
};

Thresholding.prototype.checkNeighbors = function (
  x,
  y,
  neighborhoodX,
  neighborhoodY,
  img
) {
  var color;
  var z = 0;

  color = img.getIntComponent0(x, y);

  for (var i = 0 - neighborhoodX; i <= neighborhoodX; i++) {
    for (var j = 0 - neighborhoodY; j <= neighborhoodY; j++) {
      if (i == 0 && j == 0) {
        continue;
      }

      if (
        color < getSafeColor(x + i, y + j, img) - range &&
        getSafeColor(x + i, y + j, img) != -1
      ) {
        z++;
      }
    }
  }

  if (z > neighborhoodX * neighborhoodY * 0.5) {
    return true;
  }

  return false;
};

Thresholding.prototype.getSafeColor = function (x, y, img) {
  if (x >= 0 && x < img.getWidth() && y >= 0 && y < img.getHeight()) {
    return img.getIntComponent0(x, y);
  }
  return -1;
};

function ThresholdingNeighborhood() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

ThresholdingNeighborhood.prototype.load = function () {
  this.setAttribute("neighborhoodSide", 10);
  this.setAttribute("samplingPixelDistance", 1);
  this.setAttribute("thresholdPercentageOfAverage", 1.0);
};

ThresholdingNeighborhood.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  var neighborhoodSide = this.getAttribute("neighborhoodSide");
  var samplingPixelDistance = this.getAttribute("samplingPixelDistance");
  var thresholdPercentageOfAverage = this.getAttribute(
    "thresholdPercentageOfAverage"
  );

  for (var y = 0; y < imageIn.getHeight(); y++) {
    for (var x = 0; x < imageIn.getWidth(); x++) {
      this.theshold(
        imageIn,
        imageOut,
        x,
        y,
        thresholdPercentageOfAverage,
        neighborhoodSide,
        samplingPixelDistance
      );
    }
  }
};

ThresholdingNeighborhood.prototype.theshold = function (
  image,
  imageOut,
  x,
  y,
  thresholdPercentageOfAverage,
  side,
  neighborhoodDistance
) {
  var min = -1;
  var max = -1;
  var pixels = 0;
  var average = 0;

  var inc = neighborhoodDistance;

  for (var j = y - side / 2; j < y + (inc + side / 2); j += inc) {
    for (var i = x - side / 2; i < x + side / 2; i += inc) {
      if (i >= 0 && j >= 0 && i < image.getWidth() && j < image.getHeight()) {
        var color = image.getIntComponent0(i, j);

        if (min == -1 || color < min) {
          min = color;
        }
        if (max == -1 || color > max) {
          max = color;
        }

        average += color;
        pixels++;
      }
    }
  }

  average /= pixels;

  var color = image.getIntComponent0(x, y);

  if (color < average * thresholdPercentageOfAverage || max - min <= 30) {
    imageOut.setIntColor(x, y, 255, 0, 0, 0);
  } else {
    imageOut.setIntColor(x, y, 255, 255, 255, 255);
  }
};

function CombineByAlpha() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

CombineByAlpha.prototype.load = function () {
  this.setAttribute("x", 0);
  this.setAttribute("y", 0);
  this.setAttribute("imageOther", null);
};

CombineByAlpha.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  var imageOther = this.getAttribute("imageOther");
  var x = this.getAttribute("x");
  var y = this.getAttribute("y");

  if (imageOther != null) {
    for (var j = 0; j < imageIn.getHeight(); j++) {
      for (var i = 0; i < imageIn.getWidth(); i++) {
        var ox = i - x;
        var oy = j - y;

        if (
          ox >= 0 &&
          ox < imageOther.getWidth() &&
          oy >= 0 &&
          oy < imageOther.getHeight()
        ) {
          var alpha = imageOther.getAlphaComponent(ox, oy);
          if (alpha != 0) {
            var factor = alpha / 255;

            var rA = imageIn.getIntComponent0(i, j);
            var gA = imageIn.getIntComponent1(i, j);
            var bA = imageIn.getIntComponent2(i, j);

            var rB = imageOther.getIntComponent0(ox, oy);
            var gB = imageOther.getIntComponent1(ox, oy);
            var bB = imageOther.getIntComponent2(ox, oy);

            var red = Math.floor(rA * (1 - factor) + rB * factor);
            var green = Math.floor(gA * (1 - factor) + gB * factor);
            var blue = Math.floor(bA * (1 - factor) + bB * factor);

            imageOut.setIntColor(
              i,
              j,
              Math.max(imageIn.getAlphaComponent(x, y), alpha),
              red,
              green,
              blue
            );
          } else {
            imageOut.setIntColor(i, j, imageIn.getIntColor(i, j));
          }
        } else {
          imageOut.setIntColor(i, j, imageIn.getIntColor(i, j));
        }
      }
    }
  }
};
function MergePhotos() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

MergePhotos.prototype.load = function () {
  this.background = new DetermineSceneBackground();
  this.background.load();
  this.setAttribute("threshold", 30);
};

MergePhotos.prototype.process = function (images, imageOut) {
  if (images.length > 0) {
    var threshold = this.getAttribute("threshold");
    this.background.setAttribute("threshold", threshold);
    var backgroundImage = images[0].clone();
    this.background.process(images, backgroundImage);
    MarvalImage.copyColorArray(backgroundImage, imageOut);
    this.mergePhotos(images, imageOut, backgroundImage, threshold);
  }
};

MergePhotos.prototype.mergePhotos = function (
  images,
  imageOut,
  background,
  threshold
) {
  for (var i in images) {
    var img = images[i];
    this.mergePhotosSingle(img, imageOut, background, threshold);
  }
};

MergePhotos.prototype.mergePhotosSingle = function (
  imageA,
  imageB,
  imageBackground,
  threshold
) {
  var rA, gA, bA, rB, gB, bB;
  for (var y = 0; y < imageA.getHeight(); y++) {
    for (var x = 0; x < imageA.getWidth(); x++) {
      rA = imageA.getIntComponent0(x, y);
      gA = imageA.getIntComponent1(x, y);
      bA = imageA.getIntComponent2(x, y);
      rB = imageBackground.getIntComponent0(x, y);
      gB = imageBackground.getIntComponent1(x, y);
      bB = imageBackground.getIntComponent2(x, y);

      if (
        Math.abs(rA - rB) > threshold ||
        Math.abs(gA - gB) > threshold ||
        Math.abs(bA - bB) > threshold
      ) {
        imageB.setIntColor(x, y, 255, rA, gA, bA);
      }
    }
  }
};

function Convolution() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

Convolution.prototype.load = function () {
  this.setAttribute("matrix", null);
};

Convolution.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  var matrix = this.getAttribute("matrix");

  if (matrix != null && matrix.length > 0) {
    for (var y = 0; y < imageIn.getHeight(); y++) {
      for (var x = 0; x < imageIn.getWidth(); x++) {
        if (
          y >= matrix.length / 2 &&
          y < imageIn.getHeight() - matrix.length / 2 &&
          x >= matrix[0].length / 2 &&
          x < imageIn.getWidth() - matrix[0].length / 2
        ) {
          this.applyMatrix(x, y, matrix, imageIn, imageOut);
        } else {
          imageOut.setIntColor(x, y, 0xff000000);
        }
      }
    }
  }
};

Convolution.prototype.applyMatrix = function (x, y, matrix, imageIn, imageOut) {
  var nx, ny;
  var resultRed = 0;
  var resultGreen = 0;
  var resultBlue = 0;

  var xC = Math.ceil(matrix[0].length / 2);
  var yC = Math.ceil(matrix.length / 2);

  for (var i = 0; i < matrix.length; i++) {
    for (var j = 0; j < matrix[0].length; j++) {
      if (matrix[i][j] != 0) {
        nx = x + (j - xC);
        ny = y + (i - yC);

        if (
          nx >= 0 &&
          nx < imageOut.getWidth() &&
          ny >= 0 &&
          ny < imageOut.getHeight()
        ) {
          resultRed += matrix[i][j] * imageIn.getIntComponent0(nx, ny);
          resultGreen += matrix[i][j] * imageIn.getIntComponent1(nx, ny);
          resultBlue += matrix[i][j] * imageIn.getIntComponent2(nx, ny);
        }
      }
    }
  }

  resultRed = Math.abs(resultRed);
  resultGreen = Math.abs(resultGreen);
  resultBlue = Math.abs(resultBlue);

  // allow the combination of multiple applications
  resultRed += imageOut.getIntComponent0(x, y);
  resultGreen += imageOut.getIntComponent1(x, y);
  resultBlue += imageOut.getIntComponent2(x, y);

  resultRed = Math.min(resultRed, 255);
  resultGreen = Math.min(resultGreen, 255);
  resultBlue = Math.min(resultBlue, 255);

  resultRed = Math.max(resultRed, 0);
  resultGreen = Math.max(resultGreen, 0);
  resultBlue = Math.max(resultBlue, 0);

  imageOut.setIntColor(
    x,
    y,
    imageIn.getAlphaComponent(x, y),
    Math.floor(resultRed),
    Math.floor(resultGreen),
    Math.floor(resultBlue)
  );
};

function Moravec() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

Moravec.prototype.load = function () {
  this.setAttribute("matrixSize", 3);
  this.setAttribute("threshold", 0);
};

Moravec.prototype.process = function (
  imageIn,
  imageOut,
  attrOut,
  mask,
  previewMode
) {
  var matrixSize = this.getAttribute("matrixSize");
  var threshold = this.getAttribute("threshold");

  var tempImage = new MarvalImage(imageIn.getWidth(), imageIn.getHeight());
  Marval.grayScale(imageIn, tempImage);

  var cornernessMap = MarvalJSUtils.createMatrix2D(
    tempImage.getWidth(),
    tempImage.getHeight(),
    0
  );
  var cornernessMapOut = MarvalJSUtils.createMatrix2D(
    tempImage.getWidth(),
    tempImage.getHeight(),
    0
  );

  for (var y = 0; y < tempImage.getHeight(); y++) {
    for (var x = 0; x < tempImage.getWidth(); x++) {
      cornernessMap[x][y] = this.c(x, y, matrixSize, tempImage);

      if (cornernessMap[x][y] < threshold) {
        cornernessMap[x][y] = 0;
      }
    }
  }

  for (var x = 0; x < cornernessMap.length; x++) {
    for (var y = 0; y < cornernessMap[x].length; y++) {
      cornernessMapOut[x][y] = this.nonmax(x, y, matrixSize, cornernessMap);

      if (cornernessMapOut[x][y] > 0) {
        cornernessMapOut[x][y] = 1;
      }
    }
  }

  if (attrOut != null) {
    attrOut.set("cornernessMap", cornernessMapOut);
  }
};

Moravec.prototype.nonmax = function (x, y, matrixSize, matrix) {
  var s = Math.floor(matrixSize / 2);
  if (
    x - (s + 1) >= 0 &&
    x + (s + 1) < matrix.length &&
    y - (s + 1) >= 0 &&
    y + (s + 1) < matrix[0].length
  ) {
    for (var i = -s; i <= s; i++) {
      for (var j = -s; j <= s; j++) {
        if (i != 0 || j != 0) {
          if (matrix[x][y] < matrix[x + i][y + j]) {
            return 0;
          }
        }
      }
    }
  }
  return matrix[x][y];
};

Moravec.directions = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

Moravec.prototype.c = function (x, y, matrixSize, image) {
  var ret = -1;
  var temp;
  var s = Math.floor(matrixSize / 2);
  if (
    x - (s + 1) >= 0 &&
    x + (s + 1) < image.getWidth() &&
    y - (s + 1) >= 0 &&
    y + (s + 1) < image.getHeight()
  ) {
    for (var d = 0; d < Moravec.directions.length; d++) {
      temp = 0;
      for (var i = -s; i <= s; i++) {
        for (var j = -s; j <= s; j++) {
          temp += Math.pow(
            image.getIntComponent0(x + i, y + j) -
              image.getIntComponent0(
                x + i + Moravec.directions[d][0],
                y + j + Moravec.directions[d][1]
              ),
            2
          );
        }
      }
      if (ret == -1 || temp < ret) {
        ret = temp;
      }
    }
  }
  return ret;
};

/**
 * @author Gabriel Ambr�sio Archanjo
 */
function Prewitt() {
  MarvalAbstractImagePlugin.super(this);

  // Definitions
  this.matrixPrewittX = [
    [1, 0, -1],
    [1, 0, -1],
    [1, 0, -1],
  ];

  this.matrixPrewittY = [
    [1, 1, 1],
    [0, 0, 0],
    [-1, -1, -1],
  ];

  this.load();
}

Prewitt.prototype.load = function () {
  this.convolution = new Convolution();
  this.setAttribute("intensity", 1.0);
};

Prewitt.prototype.process = function (
  imageIn,
  imageOut,
  attrOut,
  mask,
  previewMode
) {
  var intensity = this.getAttribute("intensity");

  if (intensity == 1) {
    this.convolution.setAttribute("matrix", this.matrixPrewittX);
    this.convolution.process(imageIn, imageOut, null, mask, this.previewMode);
    this.convolution.setAttribute("matrix", this.matrixPrewittY);
    this.convolution.process(imageIn, imageOut, null, mask, this.previewMode);
  } else {
    this.convolution.setAttribute(
      "matrix",
      MarvalMath.scaleMatrix(this.matrixPrewittX, intensity)
    );
    this.convolution.process(imageIn, imageOut, null, mask, previewMode);
    this.convolution.setAttribute(
      "matrix",
      MarvalMath.scaleMatrix(this.matrixPrewittY, intensity)
    );
    this.convolution.process(imageIn, imageOut, null, mask, previewMode);
  }
};

function BoundaryFill() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

BoundaryFill.prototype.load = function () {
  this.setAttribute("x", 0);
  this.setAttribute("y", 0);
  this.setAttribute("color", 0xffff0000);
  this.setAttribute("tile", null);
  this.setAttribute("threshold", 0);
};

BoundaryFill.prototype.process = function (
  imgIn,
  imgOut,
  attributesOut,
  mask,
  previewMode
) {
  var l_list = new Array();
  var l_point, l_pointW, l_pointE;

  //MarvalImage.copyColorArray(imgIn, imgOut);

  var x = this.getAttribute("x");
  var y = this.getAttribute("y");
  var tileImage = this.getAttribute("tile");
  this.threshold = this.getAttribute("threshold");

  if (!imgOut.isValidPosition(x, y)) {
    return;
  }

  var targetColor = imgIn.getIntColor(x, y);
  var targetRed = imgIn.getIntComponent0(x, y);
  var targetGreen = imgIn.getIntComponent1(x, y);
  var targetBlue = imgIn.getIntComponent2(x, y);
  var color = this.getAttribute("color");
  var newColor = color;

  var fillMask = MarvalJSUtils.createMatrix2D(
    imgOut.getWidth(),
    imgOut.getHeight,
    false
  );
  fillMask[x][y] = true;

  l_list.push(new MarvalPoint(x, y));

  //for (var l_i=0; l_i<l_list.size(); l_i++){
  while (l_list.length > 0) {
    l_point = l_list.splice(0, 1)[0]; // list poll
    l_pointW = new MarvalPoint(l_point.x, l_point.y);
    l_pointE = new MarvalPoint(l_point.x, l_point.y);

    // west
    while (true) {
      if (
        l_pointW.x - 1 >= 0 &&
        this.match(
          imgIn,
          l_pointW.x - 1,
          l_pointW.y,
          targetRed,
          targetGreen,
          targetBlue,
          this.threshold
        ) &&
        !fillMask[l_pointW.x - 1][l_pointW.y]
      ) {
        l_pointW.x--;
      } else {
        break;
      }
    }

    // east
    while (true) {
      if (
        l_pointE.x + 1 < imgIn.getWidth() &&
        this.match(
          imgIn,
          l_pointE.x + 1,
          l_pointE.y,
          targetRed,
          targetGreen,
          targetBlue,
          this.threshold
        ) &&
        !fillMask[l_pointE.x + 1][l_pointE.y]
      ) {
        l_pointE.x++;
      } else {
        break;
      }
    }

    // set color of pixels between pointW and pointE
    for (var l_px = l_pointW.x; l_px <= l_pointE.x; l_px++) {
      //imgOut.setIntColor(l_px, l_point.y, -1);
      //drawPixel(imgOut, l_px, l_point.y, newColor, tileImage);
      fillMask[l_px][l_point.y] = true;

      if (
        l_point.y - 1 >= 0 &&
        this.match(
          imgIn,
          l_px,
          l_point.y - 1,
          targetRed,
          targetGreen,
          targetBlue,
          this.threshold
        ) &&
        !fillMask[l_px][l_point.y - 1]
      ) {
        l_list.push(new MarvalPoint(l_px, l_point.y - 1));
      }
      if (
        l_point.y + 1 < imgOut.getHeight() &&
        this.match(
          imgIn,
          l_px,
          l_point.y + 1,
          targetRed,
          targetGreen,
          targetBlue,
          this.threshold
        ) &&
        !fillMask[l_px][l_point.y + 1]
      ) {
        l_list.push(new MarvalPoint(l_px, l_point.y + 1));
      }
    }
  }

  if (tileImage != null) {
    /* Plugin not ported yet. */
    /*
    		var p = MarvalPluginLoader.loadImagePlugin("org.marvalproject.image.texture.tileTexture.jar");
    		p.setAttribute("lines", (int)(Math.ceil((double)imgOut.getHeight()/tileImage.getHeight())));
    		p.setAttribute("columns", (int)(Math.ceil((double)imgOut.getWidth()/tileImage.getWidth())));
    		p.setAttribute("tile", tileImage);
    		MarvalImageMask newMask = new MarvalImageMask(fillMask);    		
    		p.process(imgOut, imgOut, null, newMask, false);
			*/
  } else {
    for (var j = 0; j < imgOut.getHeight(); j++) {
      for (var i = 0; i < imgOut.getWidth(); i++) {
        if (fillMask[i][j]) {
          imgOut.setIntColor(i, j, newColor);
        }
      }
    }
  }
};

BoundaryFill.prototype.match = function (
  image,
  x,
  y,
  targetRed,
  targetGreen,
  targetBlue,
  threshold
) {
  var diff =
    Math.abs(image.getIntComponent0(x, y) - targetRed) +
    Math.abs(image.getIntComponent1(x, y) - targetGreen) +
    Math.abs(image.getIntComponent2(x, y) - targetBlue);
  return diff <= threshold;
};

function ErrorDiffusion() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

ErrorDiffusion.prototype.load = function () {
  this.threshold = 128;
};

ErrorDiffusion.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  var color;
  var dif;

  Marval.grayScale(imageIn, imageOut, attributesOut, mask, previewMode);

  // Mask
  var l_arrMask;
  if (mask != null) {
    l_arrMask = mask.getMask();
  }

  for (var y = 0; y < imageOut.getHeight(); y++) {
    for (var x = 0; x < imageOut.getWidth(); x++) {
      if (l_arrMask != null && !l_arrMask[x][y]) {
        continue;
      }

      var color = imageOut.getIntComponent0(x, y);
      if (color > this.threshold) {
        imageOut.setIntColor(
          x,
          y,
          imageIn.getAlphaComponent(x, y),
          255,
          255,
          255
        );
        dif = -(255 - color);
      } else {
        imageOut.setIntColor(x, y, imageIn.getAlphaComponent(x, y), 0, 0, 0);
        dif = color;
      }

      // Pixel Right
      if (x + 1 < imageOut.getWidth()) {
        color = imageOut.getIntComponent0(x + 1, y);
        color += Math.floor(0.4375 * dif);
        color = this.getValidGray(color);
        imageOut.setIntColor(
          x + 1,
          y,
          imageIn.getAlphaComponent(x + 1, y),
          color,
          color,
          color
        );

        // Pixel Right Down
        if (y + 1 < imageOut.getHeight()) {
          color = imageOut.getIntComponent0(x + 1, y + 1);
          color += Math.floor(0.0625 * dif);
          color = this.getValidGray(color);
          imageOut.setIntColor(
            x + 1,
            y + 1,
            imageIn.getAlphaComponent(x + 1, y + 1),
            color,
            color,
            color
          );
        }
      }

      // Pixel Down
      if (y + 1 < imageOut.getHeight()) {
        color = imageOut.getIntComponent0(x, y + 1);
        color += Math.floor(0.3125 * dif);
        color = this.getValidGray(color);
        imageOut.setIntColor(
          x,
          y + 1,
          imageIn.getAlphaComponent(x, y + 1),
          color,
          color,
          color
        );

        // Pixel Down Left
        if (x - 1 >= 0) {
          color = imageOut.getIntComponent0(x - 1, y + 1);
          color += Math.floor(0.1875 * dif);
          color = this.getValidGray(color);
          imageOut.setIntColor(
            x - 1,
            y + 1,
            imageIn.getAlphaComponent(x - 1, y + 1),
            color,
            color,
            color
          );
        }
      }
    }
  }
};

ErrorDiffusion.prototype.getValidGray = function (a_value) {
  if (a_value < 0) return 0;
  if (a_value > 255) return 255;
  return a_value;
};

var MarvalAbstractImagePlugin = new Object();

MarvalAbstractImagePlugin.super = function (ref) {
  ref.attributes = {};
  ref["setAttribute"] = MarvalAbstractImagePlugin.setAttribute;
  ref["getAttribute"] = MarvalAbstractImagePlugin.getAttribute;
};

MarvalAbstractImagePlugin.setAttribute = function (label, value) {
  this.attributes[label] = value;
};

MarvalAbstractImagePlugin.getAttribute = function (label, value) {
  return this.attributes[label];
};
function Closing() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

Closing.prototype.load = function () {
  this.matrix = MarvalJSUtils.createMatrix2D(3, 3, true);
  this.setAttribute("matrix", 3);
};

Closing.prototype.process = function (
  imgIn,
  imgOut,
  attributesOut,
  mask,
  previewMode
) {
  var matrix = this.getAttribute("matrix");

  if (
    imgIn.getColorModel() == MarvalImage.COLOR_MODEL_BINARY &&
    matrix != null
  ) {
    Marval.morphologicalDilation(imgIn, imgOut, matrix);
    MarvalImage.copyColorArray(imgOut, imgIn);
    Marval.morphologicalErosion(imgIn, imgOut, matrix);
  }
};

function Dilation() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

Dilation.prototype.load = function () {
  this.matrix = MarvalJSUtils.createMatrix2D(3, 3, true);
  this.setAttribute("matrix", 3);
};

Dilation.prototype.process = function (
  imgIn,
  imgOut,
  attributesOut,
  mask,
  previewMode
) {
  var matrix = this.getAttribute("matrix");

  if (
    imgIn.getColorModel() == MarvalImage.COLOR_MODEL_BINARY &&
    matrix != null
  ) {
    MarvalImage.copyColorArray(imgIn, imgOut);

    for (var y = 0; y < imgIn.getHeight(); y++) {
      for (var x = 0; x < imgIn.getWidth(); x++) {
        this.applyMatrix(x, y, matrix, imgIn, imgOut);
      }
    }
  }
};

Dilation.prototype.applyMatrix = function (x, y, matrix, imgIn, imgOut) {
  var nx, ny;
  var xC = matrix[0].length / 2;
  var yC = matrix.length / 2;

  if (imgIn.getBinaryColor(x, y)) {
    for (var i = 0; i < matrix.length; i++) {
      for (var j = 0; j < matrix.length; j++) {
        if ((i != yC || j != xC) && matrix[i][j]) {
          nx = x + (j - xC);
          ny = y + (i - yC);

          if (
            nx > 0 &&
            nx < imgOut.getWidth() &&
            ny > 0 &&
            ny < imgOut.getHeight()
          ) {
            imgOut.setBinaryColor(nx, ny, true);
          }
        }
      }
    }
  }
};

function Erosion() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

Erosion.prototype.load = function () {
  this.matrix = MarvalJSUtils.createMatrix2D(3, 3, true);
  this.setAttribute("matrix", 3);
};

Erosion.prototype.process = function (
  imgIn,
  imgOut,
  attributesOut,
  mask,
  previewMode
) {
  var matrix = this.getAttribute("matrix");

  if (
    imgIn.getColorModel() == MarvalImage.COLOR_MODEL_BINARY &&
    matrix != null
  ) {
    MarvalImage.copyColorArray(imgIn, imgOut);

    for (var y = 0; y < imgIn.getHeight(); y++) {
      for (var x = 0; x < imgIn.getWidth(); x++) {
        this.applyMatrix(x, y, matrix, imgIn, imgOut);
      }
    }
  }
};

Erosion.prototype.applyMatrix = function (x, y, matrix, imgIn, imgOut) {
  var nx, ny;

  var xC = Math.floor(matrix[0].length / 2);
  var yC = Math.floor(matrix.length / 2);

  if (!imgIn.getBinaryColor(x, y)) {
    for (var i = 0; i < matrix.length; i++) {
      for (var j = 0; j < matrix[0].length; j++) {
        if ((i != yC || j != xC) && matrix[i][j]) {
          nx = x + (j - xC);
          ny = y + (i - yC);

          if (
            nx >= 0 &&
            nx < imgOut.getWidth() &&
            ny >= 0 &&
            ny < imgOut.getHeight()
          ) {
            imgOut.setBinaryColor(nx, ny, false);
          }
        }
      }
    }
  }
};

function FindTextRegions() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

FindTextRegions.prototype.load = function () {
  this.setAttribute("maxWhiteSpace", 10);
  this.setAttribute("maxFontLineWidth", 10);
  this.setAttribute("minTextWidth", 30);
  this.setAttribute("grayScaleThreshold", 127);
};

FindTextRegions.prototype.process = function (
  imageIn,
  imageOut,
  attrOut,
  mask,
  previewMode
) {
  // The image will be affected so it's generated a new instance
  imageIn = imageIn.clone();

  var maxWhiteSpace = this.getAttribute("maxWhiteSpace");
  var maxFontLineWidth = this.getAttribute("maxFontLineWidth");
  var minTextWidth = this.getAttribute("minTextWidth");
  var grayScaleThreshold = this.getAttribute("grayScaleThreshold");

  Marval.thresholding(imageIn, imageIn, grayScaleThreshold);

  var segments = [];
  for (var i = 0; i < imageIn.getHeight(); i++) {
    segments.push([]);
  }

  // map of already processed pixels

  var processed = MarvalJSUtils.createMatrix2D(
    imageIn.getWidth(),
    imageIn.getHeight,
    false
  );

  var color;
  var patternStartX = -1;
  var patternLength = 0;
  var whitePixels = 0;
  var blackPixels = 0;
  for (var y = 0; y < imageIn.getHeight(); y++) {
    for (var x = 0; x < imageIn.getWidth(); x++) {
      if (!processed[x][y]) {
        color = imageIn.getIntColor(x, y);

        if (color == 0xffffffff && patternStartX != -1) {
          whitePixels++;
          blackPixels = 0;
        }

        if (color == 0xff000000) {
          blackPixels++;

          if (patternStartX == -1) {
            patternStartX = x;
          }

          whitePixels = 0;
        }

        // check white and black pattern maximum lenghts
        if (
          whitePixels > maxWhiteSpace ||
          blackPixels > maxFontLineWidth ||
          x == imageIn.getWidth() - 1
        ) {
          if (patternLength >= minTextWidth) {
            var list = segments[y];
            list.push([patternStartX, y, patternStartX + patternLength, y]);
          }

          whitePixels = 0;
          blackPixels = 0;
          patternLength = 0;
          patternStartX = -1;
        }

        if (patternStartX != -1) {
          patternLength++;
        }

        processed[x][y] = true;
      }
    }
  }

  // Group line patterns intersecting in x coordinate and too near in y coordinate.
  for (var y = 0; y < imageIn.getHeight() - 2; y++) {
    var listY = segments[y];

    for (var w = y + 1; w <= y + 2; w++) {
      var listW = segments[w];

      for (var i = 0; i < listY.length; i++) {
        var sA = listY[i];
        for (var j = 0; j < listW.length; j++) {
          var sB = listW[j];

          // horizontal intersection
          if (
            (sA[0] <= sB[0] && sA[2] >= sB[2]) ||
            (sA[0] >= sB[0] && sA[0] <= sB[2]) ||
            (sA[2] >= sB[0] && sA[2] <= sB[2])
          ) {
            sA[0] = Math.min(sA[0], sB[0]);
            sA[2] = Math.max(sA[2], sB[2]);
            sA[3] = sB[3];

            listY.splice(i, 1);
            i--;

            listW.splice(j, 1);
            listW.push(sA);

            break;
          }
        }
      }
    }
  }

  // Convert the result to a List<> of MarvalSegment objects.
  var marvalSegments = [];
  for (var y = 0; y < imageIn.getHeight(); y++) {
    var list = segments[y];
    for (var i in list) {
      var seg = list[i];
      marvalSegments.push(new MarvalSegment(seg[0], seg[1], seg[2], seg[3]));
    }
  }

  attrOut.set("matches", marvalSegments);
};

function IteratedFunctionSystem() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

IteratedFunctionSystem.prototype.load = function () {
  this.rules = [];
  this.EXAMPLE_RULES =
    "0,0,0,0.16,0,0,0.01\n" +
    "0.85,0.04,-0.04,0.85,0,1.6,0.85\n" +
    "0.2,-0.26,0.23,0.22,0,1.6,0.07\n" +
    "-0.15,0.28,0.26,0.24,0,0.44,0.07\n";

  this.setAttribute("rules", this.EXAMPLE_RULES);
  this.setAttribute("iterations", 1000000);
};

/*
	private MarvalAttributesPanel	attributesPanel;
	private MarvalAttributes 		attributes;
	
	private List<Rule> rules;
	
	// Testing String
	private final static String EXAMPLE_RULES = 	"0,0,0,0.16,0,0,0.01\n"+
											"0.85,0.04,-0.04,0.85,0,1.6,0.85\n"+
											"0.2,-0.26,0.23,0.22,0,1.6,0.07\n"+
											"-0.15,0.28,0.26,0.24,0,0.44,0.07\n";
	@Override
	public void load() {
		attributes = getAttributes();
		attributes.set("rules", EXAMPLE_RULES);
		attributes.set("iterations", 1000000);
		
		rules = new ArrayList<Rule>();
	}
	*/

IteratedFunctionSystem.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  this.loadRules();
  var iterations = this.getAttribute("iterations");

  var x0 = 0;
  var y0 = 0;
  var x, y;
  var startX;
  var startY;
  var factor;

  var minX = 999999999,
    minY = 999999999,
    maxX = -999999999,
    maxY = -99999999;

  var tempRule;
  var point = [x0, y0];

  imageOut.clear(0xffffffff);

  for (var i = 0; i < iterations; i++) {
    tempRule = this.getRule();
    this.applyRule(point, tempRule);

    x = point[0];
    y = point[1];

    if (x < minX) {
      minX = x;
    }
    if (x > maxX) {
      maxX = x;
    }
    if (y < minY) {
      minY = y;
    }
    if (y > maxY) {
      maxY = y;
    }
  }

  var width = imageOut.getWidth();
  var height = imageOut.getHeight();

  var deltaX = Math.abs(maxX - minX);
  var deltaY = Math.abs(maxY - minY);
  if (deltaX > deltaY) {
    factor = width / deltaX;
    if (deltaY * factor > height) {
      factor = factor * (height / (deltaY * factor));
    }
  } else {
    factor = height / deltaY;
    if (deltaX * factor > width) {
      factor = factor * (width / (deltaX * factor));
    }
  }

  factor *= 0.9;

  startX = Math.floor(width / 2 - (minX + deltaX / 2) * factor);
  startY = Math.floor(height - (height / 2 - (minY + deltaY / 2) * factor));

  point[0] = x0;
  point[1] = y0;

  for (var i = 0; i < iterations; i++) {
    tempRule = this.getRule();
    this.applyRule(point, tempRule);

    x = Math.floor(point[0] * factor + startX);
    y = startY - Math.floor(point[1] * factor);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      imageOut.setIntColor(Math.floor(x), Math.floor(y), 255, 0);
    }
  }
};

IteratedFunctionSystem.prototype.loadRules = function () {
  this.rules = [];
  var r = this.getAttribute("rules").split("\n");

  for (var i = 0; i < r.length; i++) {
    this.addRule(r[i]);
  }
};

IteratedFunctionSystem.prototype.addRule = function (rule) {
  rule = rule.replace(/ /g, ""); //replace all spaces
  var attr = rule.split(",");

  if (attr.length == 7) {
    var r = new Object();
    r.a = parseFloat(attr[0]);
    r.b = parseFloat(attr[1]);
    r.c = parseFloat(attr[2]);
    r.d = parseFloat(attr[3]);
    r.e = parseFloat(attr[4]);
    r.f = parseFloat(attr[5]);
    r.probability = parseFloat(attr[6]);

    /*
			(
				parseFloat(attr[0]),
				parseFloat(attr[1]),
				parseFloat(attr[2]),
				parseFloat(attr[3]),
				parseFloat(attr[4]),
				parseFloat(attr[5]),
				parseFloat(attr[6])
			);
			*/

    this.rules.push(r);
  }
};

IteratedFunctionSystem.prototype.getRule = function () {
  var random = Math.random();
  var sum = 0;
  var i;
  for (i = 0; i < this.rules.length; i++) {
    sum += this.rules[i].probability;
    if (random < sum) {
      return this.rules[i];
    }
  }

  if (i != 0) {
    return this.rules[i - 1];
  }
  return this.rules[0];
};

IteratedFunctionSystem.prototype.applyRule = function (point, rule) {
  var nx = rule.a * point[0] + rule.b * point[1] + rule.e;
  var ny = rule.c * point[0] + rule.d * point[1] + rule.f;
  point[0] = nx;
  point[1] = ny;
};

function Crop() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

Crop.prototype.load = function () {
  this.setAttribute("x", 0);
  this.setAttribute("y", 0);
  this.setAttribute("width", 0);
  this.setAttribute("height", 0);
};

Crop.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  var x = this.getAttribute("x");
  var y = this.getAttribute("y");
  var width = this.getAttribute("width");
  var height = this.getAttribute("height");

  imageOut.setDimension(width, height);

  for (var i = x; i < x + width; i++) {
    for (var j = y; j < y + height; j++) {
      imageOut.setIntColor(i - x, j - y, imageIn.getIntColor(i, j));
    }
  }
};

function FloodfillSegmentation() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

FloodfillSegmentation.prototype.load = function () {
  this.setAttribute("returnType", "MarvalSegment");
};

FloodfillSegmentation.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  if (attributesOut != null) {
    var returnType = this.getAttribute("returnType");
    var fillBuffer = imageIn.clone();
    var segments = this.floodfillSegmentation(imageIn, fillBuffer);

    switch (returnType) {
      case "MarvalSegment":
        attributesOut.set("segments", segments);
        break;
      case "MarvalBlobSegment":
        attributesOut.set("blobSegments", blobSegments(fillBuffer, segments));
        break;
    }
  }
};

FloodfillSegmentation.prototype.floodfillSegmentation = function (
  image,
  fillBuffer
) {
  fillBuffer.clear(0xff000000);

  var currentColor = 1;
  for (var y = 0; y < image.getHeight(); y++) {
    for (var x = 0; x < image.getWidth(); x++) {
      var color = fillBuffer.getIntColor(x, y);

      if ((color & 0x00ffffff) == 0 && image.getAlphaComponent(x, y) > 0) {
        var c = 0xff000000 | currentColor++;
        Marval.boundaryFill(image, fillBuffer, x, y, c);
      }
    }
  }

  var segments = new Array(currentColor - 1);
  var seg;
  for (var y = 0; y < fillBuffer.getHeight(); y++) {
    for (var x = 0; x < fillBuffer.getWidth(); x++) {
      var color = fillBuffer.getIntColor(x, y) & 0x00ffffff;

      if (color != 0x00ffffff && color > 0) {
        seg = segments[color - 1];

        if (seg == null) {
          seg = new MarvalSegment();
          segments[color - 1] = seg;
        }

        // x and width
        if (seg.x1 == -1 || x < seg.x1) {
          seg.x1 = x;
        }
        if (seg.x2 == -1 || x > seg.x2) {
          seg.x2 = x;
        }
        seg.width = seg.x2 - seg.x1 + 1;

        // y and height;
        if (seg.y1 == -1 || y < seg.y1) {
          seg.y1 = y;
        }
        if (seg.y2 == -1 || y > seg.y2) {
          seg.y2 = y;
        }
        seg.height = seg.y2 - seg.y1 + 1;

        seg.area++;
      }
    }
  }

  return segments;
};

FloodfillSegmentation.prototype.blobSegments = function (image, segments) {
  var blobSegments = new Array(segments.length);

  var colorSegment;
  var seg;
  for (var i = 0; i < segments.length; i++) {
    seg = segments[i];
    colorSegment = 0xff000000 + (i + 1);

    blobSegments[i] = new MarvalBlobSegment(seg.x1, seg.y1);
    var tempBlob = new MarvalBlob(seg.width, seg.height);
    blobSegments[i].setBlob(tempBlob);

    for (var y = seg.y1; y <= seg.y2; y++) {
      for (var x = seg.x1; x <= seg.x2; x++) {
        if (image.getIntColor(x, y) == colorSegment) {
          tempBlob.setValue(x - seg.x1, y - seg.y1, true);
        }
      }
    }
  }
  return blobSegments;
};

function Scale() {
  MarvalAbstractImagePlugin.super(this);
  this.load();
}

Scale.prototype.load = function () {
  // Attributes
  this.setAttribute("newWidth", 0);
  this.setAttribute("newHeight", 0);
};

Scale.prototype.process = function (
  imageIn,
  imageOut,
  attributesOut,
  mask,
  previewMode
) {
  if (!previewMode) {
    var width = imageIn.getWidth();
    var height = imageIn.getHeight();
    var newWidth = this.getAttribute("newWidth");
    var newHeight = this.getAttribute("newHeight");

    if (imageOut.getWidth() != newWidth || imageOut.getHeight() != newHeight) {
      imageOut.setDimension(newWidth, newHeight);
    }

    var x_ratio = Math.floor((width << 16) / newWidth);
    var y_ratio = Math.floor((height << 16) / newHeight);
    var x2, y2;
    for (var i = 0; i < newHeight; i++) {
      for (var j = 0; j < newWidth; j++) {
        x2 = Math.floor((j * x_ratio) >> 16);
        y2 = Math.floor((i * y_ratio) >> 16);
        imageOut.setIntColor(
          j,
          i,
          imageIn.getAlphaComponent(x2, y2),
          imageIn.getIntColor(x2, y2)
        );
      }
    }
  }
};

function MarvalAttributes() {
  this.hashAttributes = new Object();
}

MarvalAttributes.prototype.set = function (name, value) {
  this.hashAttributes[name] = value;
};

MarvalAttributes.prototype.get = function (name, defaultValue) {
  var ret = this.hashAttributes[name];

  if (ret != null) {
    return ret;
  }
  return defaultValue;
};

MarvalAttributes.prototype.clone = function () {
  var attrs = new MarvalAttributes();

  for (var key in this.hashAttributes) {
    attrs.set(key, this.hashAttributes[key]);
  }
  return attrs;
};
function MarvalPoint(x, y) {
  this.x = x;
  this.y = y;
}

MarvalPoint.prototype.setX = function (x) {
  this.x = x;
};

MarvalPoint.prototype.getX = function () {
  return this.x;
};

MarvalPoint.prototype.setY = function (x) {
  this.y = y;
};

MarvalPoint.prototype.getY = function () {
  return this.y;
};
var marvalLoadPluginMethods = function (callback) {
  Marval.plugins = new Object();

  // Alpha Boundary
  Marval.plugins.alphaBoundary = new AlphaBoundary();
  Marval.alphaBoundary = function (imageIn, imageOut, radius) {
    Marval.plugins.alphaBoundary.setAttribute("radius", radius);
    Marval.plugins.alphaBoundary.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Average Color
  Marval.plugins.averageColor = new AverageColor();
  Marval.averageColor = function (imageIn) {
    var attrOut = new MarvalAttributes();
    Marval.plugins.averageColor.process(
      imageIn,
      null,
      attrOut,
      MarvalImageMask.NULL_MASK,
      false
    );
    return attrOut.get("averageColor");
  };

  // Black And White
  Marval.plugins.blackAndWhite = new BlackAndWhite();
  Marval.blackAndWhite = function (imageIn, imageOut, level) {
    Marval.plugins.blackAndWhite.setAttribute("level", level);
    Marval.plugins.blackAndWhite.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // BoundaryFill
  Marval.plugins.boundaryFill = new BoundaryFill();
  Marval.boundaryFill = function (imageIn, imageOut, x, y, color, threshold) {
    Marval.plugins.boundaryFill.setAttribute("x", x);
    Marval.plugins.boundaryFill.setAttribute("y", y);
    Marval.plugins.boundaryFill.setAttribute("color", color);
    if (threshold != null) {
      Marval.plugins.boundaryFill.setAttribute("threshold", threshold);
    }

    Marval.plugins.boundaryFill.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Brightness and Contrast
  Marval.plugins.brightnessAndContrast = new BrightnessAndContrast();
  Marval.brightnessAndContrast = function (
    imageIn,
    imageOut,
    brightness,
    contrast
  ) {
    Marval.plugins.brightnessAndContrast.setAttribute("brightness", brightness);
    Marval.plugins.brightnessAndContrast.setAttribute("contrast", contrast);
    Marval.plugins.brightnessAndContrast.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Color Channel
  Marval.plugins.colorChannel = new ColorChannel();
  Marval.colorChannel = function (imageIn, imageOut, red, green, blue) {
    Marval.plugins.colorChannel.setAttribute("red", red);
    Marval.plugins.colorChannel.setAttribute("green", green);
    Marval.plugins.colorChannel.setAttribute("blue", blue);
    Marval.plugins.colorChannel.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Color Channel
  Marval.plugins.crop = new Crop();
  Marval.crop = function (imageIn, imageOut, x, y, width, height) {
    Marval.plugins.crop.setAttribute("x", x);
    Marval.plugins.crop.setAttribute("y", y);
    Marval.plugins.crop.setAttribute("width", width);
    Marval.plugins.crop.setAttribute("height", height);
    Marval.plugins.crop.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Combine by Alpha
  Marval.plugins.combineByAlpha = new CombineByAlpha();
  Marval.combineByAlpha = function (imageIn, imageOther, imageOut, x, y) {
    Marval.plugins.combineByAlpha.setAttribute("imageOther", imageOther);
    Marval.plugins.combineByAlpha.setAttribute("x", x);
    Marval.plugins.combineByAlpha.setAttribute("y", y);
    Marval.plugins.combineByAlpha.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Emboss
  Marval.plugins.emboss = new Emboss();
  Marval.emboss = function (imageIn, imageOut) {
    Marval.plugins.emboss.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Emboss
  Marval.plugins.halftoneErrorDiffusion = new ErrorDiffusion();
  Marval.halftoneErrorDiffusion = function (imageIn, imageOut) {
    Marval.plugins.halftoneErrorDiffusion.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // FindTextRegions
  Marval.plugins.findTextRegions = new FindTextRegions();
  Marval.findTextRegions = function (
    imageIn,
    maxWhiteSpace,
    maxFontLineWidth,
    minTextWidth,
    grayScaleThreshold
  ) {
    var attrOut = new MarvalAttributes();
    Marval.plugins.findTextRegions.setAttribute(
      "maxWhiteSpace",
      Marval.getValue(maxWhiteSpace, 10)
    );
    Marval.plugins.findTextRegions.setAttribute(
      "maxFontLineWidth",
      Marval.getValue(maxFontLineWidth, 10)
    );
    Marval.plugins.findTextRegions.setAttribute(
      "minTextWidth",
      Marval.getValue(minTextWidth, 30)
    );
    Marval.plugins.findTextRegions.setAttribute(
      "grayScaleThreshold",
      Marval.getValue(grayScaleThreshold, 127)
    );
    Marval.plugins.findTextRegions.process(
      imageIn,
      null,
      attrOut,
      MarvalImageMask.NULL_MASK,
      false
    );
    return attrOut.get("matches");
  };

  // Floodfill Segmentation
  Marval.plugins.floodfillSegmentation = new FloodfillSegmentation();
  Marval.floodfillSegmentation = function (imageIn) {
    var attrOut = new MarvalAttributes();
    Marval.plugins.floodfillSegmentation.setAttribute(
      "returnType",
      "MarvalSegment"
    );
    Marval.plugins.floodfillSegmentation.process(
      imageIn,
      null,
      attrOut,
      MarvalImageMask.NULL_MASK,
      false
    );
    return attrOut.get("segments");
  };

  // Gaussian Blur
  Marval.plugins.gaussianBlur = new GaussianBlur();
  Marval.gaussianBlur = function (imageIn, imageOut, radius) {
    Marval.plugins.gaussianBlur.setAttribute(
      "radius",
      Marval.getValue(radius, 3.0)
    );
    Marval.plugins.gaussianBlur.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Invert
  Marval.plugins.invertColors = new Invert();
  Marval.invertColors = function (imageIn, imageOut) {
    Marval.plugins.invertColors.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // ColorNoise
  Marval.plugins.colorNoise = new ColorNoise();
  Marval.colorNoise = function (imageIn, imageOut, intensity) {
    Marval.plugins.colorNoise.setAttribute(
      "intensity",
      Marval.getValue(intensity, 0.5)
    );
    Marval.plugins.colorNoise.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // BlackAndWhiteNoise
  Marval.plugins.blackAndWhiteNoise = new BlackAndWhiteNoise();
  Marval.blackAndWhiteNoise = function (imageIn, imageOut, intensity) {
    Marval.plugins.blackAndWhiteNoise.setAttribute(
      "intensity",
      Marval.getValue(intensity, 0.5)
    );
    Marval.plugins.blackAndWhiteNoise.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // HorizontalScanLines
  Marval.plugins.horizontalScanLines = new HorizontalScanLines();
  Marval.horizontalScanLines = function (imageIn, imageOut, intensity) {
    Marval.plugins.horizontalScanLines.setAttribute(
      "intensity",
      Marval.getValue(intensity, 64)
    );
    Marval.plugins.horizontalScanLines.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // VerticalScanLines
  Marval.plugins.verticalScanLines = new VerticalScanLines();
  Marval.verticalScanLines = function (imageIn, imageOut, intensity) {
    Marval.plugins.verticalScanLines.setAttribute(
      "intensity",
      Marval.getValue(intensity, 64)
    );
    Marval.plugins.verticalScanLines.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // ColorSort
  Marval.plugins.colorSort = new ColorSort();
  Marval.colorSort = function (imageIn, imageOut, weighted) {
    Marval.plugins.colorSort.setAttribute(
      "weighted", weighted
    );
    Marval.plugins.colorSort.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  Marval.plugins.iteratedFunctionSystem = new IteratedFunctionSystem();
  Marval.iteratedFunctionSystem = function (
    imageIn,
    imageOut,
    rules,
    iterations
  ) {
    Marval.plugins.iteratedFunctionSystem.setAttribute("rules", rules);
    Marval.plugins.iteratedFunctionSystem.setAttribute(
      "iterations",
      iterations
    );
    Marval.plugins.iteratedFunctionSystem.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // GrayScale
  Marval.plugins.grayScale = new GrayScale();
  Marval.grayScale = function (imageIn, imageOut) {
    Marval.plugins.grayScale.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  //Merge Photos
  Marval.plugins.mergePhotos = new MergePhotos();
  Marval.mergePhotos = function (images, imageOut, threshold) {
    Marval.plugins.mergePhotos.setAttribute("threshold", threshold);
    Marval.plugins.mergePhotos.process(images, imageOut);
  };

  // Moravec
  Marval.plugins.moravec = new Moravec();
  Marval.moravec = function (imageIn, imageOut, matrixSize, threshold) {
    var attrOut = new MarvalAttributes();
    Marval.plugins.moravec.setAttribute("matrixSize", matrixSize);
    Marval.plugins.moravec.setAttribute("threshold", threshold);
    Marval.plugins.moravec.process(
      imageIn,
      imageOut,
      attrOut,
      MarvalImageMask.NULL_MASK,
      false
    );
    return attrOut.get("cornernessMap");
  };

  // Morphological Dilation
  Marval.plugins.morphologicalDilation = new Dilation();
  Marval.morphologicalDilation = function (imageIn, imageOut, matrix) {
    Marval.plugins.morphologicalDilation.setAttribute("matrix", matrix);
    Marval.plugins.morphologicalDilation.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Morphological Erosion
  Marval.plugins.morphologicalErosion = new Erosion();
  Marval.morphologicalErosion = function (imageIn, imageOut, matrix) {
    Marval.plugins.morphologicalErosion.setAttribute("matrix", matrix);
    Marval.plugins.morphologicalErosion.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Morphological Closing
  Marval.plugins.morphologicalClosing = new Closing();
  Marval.morphologicalClosing = function (imageIn, imageOut, matrix) {
    Marval.plugins.morphologicalClosing.setAttribute("matrix", matrix);
    Marval.plugins.morphologicalClosing.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Prewitt
  Marval.plugins.prewitt = new Prewitt();
  Marval.prewitt = function (imageIn, imageOut, intensity) {
    Marval.plugins.prewitt.setAttribute(
      "intensity",
      Marval.getValue(intensity, 1.0)
    );
    Marval.plugins.prewitt.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Scale
  Marval.plugins.scale = new Scale();
  Marval.scale = function (imageIn, imageOut, newWidth, newHeight) {
    if (newHeight == null) {
      var factor = imageIn.getHeight() / imageIn.getWidth();
      newHeight = Math.floor(factor * newWidth);
    }

    Marval.plugins.scale.setAttribute("newWidth", newWidth);
    Marval.plugins.scale.setAttribute("newHeight", newHeight);
    Marval.plugins.scale.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Sepia
  Marval.plugins.sepia = new Sepia();
  Marval.sepia = function (imageIn, imageOut, intensity) {
    Marval.plugins.sepia.setAttribute("intensity", intensity);
    Marval.plugins.sepia.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // Thresholding
  Marval.plugins.thresholding = new Thresholding();
  Marval.thresholding = function (
    imageIn,
    imageOut,
    threshold,
    thresholdRange
  ) {
    Marval.plugins.thresholding.setAttribute("threshold", threshold);
    Marval.plugins.thresholding.setAttribute("thresholdRange", thresholdRange);
    Marval.plugins.thresholding.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };

  // ThresholdingNeighborhood
  Marval.plugins.thresholdingNeighborhood = new ThresholdingNeighborhood();
  Marval.thresholdingNeighborhood = function (
    imageIn,
    imageOut,
    thresholdPercentageOfAverage,
    neighborhoodSide,
    samplingPixelDistance
  ) {
    Marval.plugins.thresholdingNeighborhood.setAttribute(
      "thresholdPercentageOfAverage",
      thresholdPercentageOfAverage
    );
    Marval.plugins.thresholdingNeighborhood.setAttribute(
      "neighborhoodSide",
      neighborhoodSide
    );
    Marval.plugins.thresholdingNeighborhood.setAttribute(
      "samplingPixelDistance",
      samplingPixelDistance
    );
    Marval.plugins.thresholdingNeighborhood.process(
      imageIn,
      imageOut,
      null,
      MarvalImageMask.NULL_MASK,
      false
    );
  };
};

var Marval = new Object();

Marval.getValue = function (value, defaultValue) {
  if (value != null) {
    return value;
  } else {
    return defaultValue;
  }
};

marvalLoadPluginMethods();

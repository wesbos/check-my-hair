parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"K1T5":[function(require,module,exports) {
"use strict";function e(e){var s=exports.errorMessages.find(function(s){return s.name===e.name});return s?s.message:"Oops - something went wrong!"}Object.defineProperty(exports,"__esModule",{value:!0}),exports.getFriendlyErrorMessage=exports.errorMessages=void 0,exports.errorMessages=[{name:"NotFoundError",message:"Looks like we cant access your webcam"},{name:"DevicesNotFoundError",message:"Looks like we cant access your webcam"},{name:"NotReadableError",message:"Looks like we cant access your webcam"},{name:"TrackStartError",message:"Looks like we cant access your webcam"},{name:"OverconstrainedError",message:"Looks like we cant access your webcam"},{name:"ConstraintNotSatisfiedError",message:"Looks like we cant access your webcam"},{name:"NotAllowedError",message:"Looks like we cant access your webcam"},{name:"PermissionDeniedError",message:"Looks like we cant access your webcam"}],exports.getFriendlyErrorMessage=e;
},{}],"JGqJ":[function(require,module,exports) {
"use strict";var e=this&&this.__awaiter||function(e,t,n,r){return new(n||(n=Promise))(function(i,o){function a(e){try{u(r.next(e))}catch(t){o(t)}}function c(e){try{u(r.throw(e))}catch(t){o(t)}}function u(e){var t;e.done?i(e.value):(t=e.value,t instanceof n?t:new n(function(e){e(t)})).then(a,c)}u((r=r.apply(e,t||[])).next())})},t=this&&this.__generator||function(e,t){var n,r,i,o,a={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return o={next:c(0),throw:c(1),return:c(2)},"function"==typeof Symbol&&(o[Symbol.iterator]=function(){return this}),o;function c(o){return function(c){return function(o){if(n)throw new TypeError("Generator is already executing.");for(;a;)try{if(n=1,r&&(i=2&o[0]?r.return:o[0]?r.throw||((i=r.return)&&i.call(r),0):r.next)&&!(i=i.call(r,o[1])).done)return i;switch(r=0,i&&(o=[2&o[0],i.value]),o[0]){case 0:case 1:i=o;break;case 4:return a.label++,{value:o[1],done:!1};case 5:a.label++,r=o[1],o=[0];continue;case 7:o=a.ops.pop(),a.trys.pop();continue;default:if(!(i=(i=a.trys).length>0&&i[i.length-1])&&(6===o[0]||2===o[0])){a=0;continue}if(3===o[0]&&(!i||o[1]>i[0]&&o[1]<i[3])){a.label=o[1];break}if(6===o[0]&&a.label<i[1]){a.label=i[1],i=o;break}if(i&&a.label<i[2]){a.label=i[2],a.ops.push(o);break}i[2]&&a.ops.pop(),a.trys.pop();continue}o=t.call(e,a)}catch(c){o=[6,c],r=0}finally{n=i=0}if(5&o[0])throw o[1];return{value:o[0]?o[1]:void 0,done:!0}}([o,c])}}};Object.defineProperty(exports,"__esModule",{value:!0});var n=require("./errorMessages"),r=document.querySelector(".video"),i=document.querySelector(".text"),o=document.querySelector(".start-camera");function a(e){if(!i)throw new Error("shit");i.textContent=(0,n.getFriendlyErrorMessage)(e)}function c(){return e(this,void 0,void 0,function(){var e;return t(this,function(t){switch(t.label){case 0:return[4,navigator.mediaDevices.enumerateDevices()];case 1:return e=t.sent(),[2,e.filter(function(e){return"videoinput"===e.kind}).filter(function(e){return!e.label.includes("Camo")})]}})})}function u(e){var t='\n    <div class="camera">\n      <video autoplay playsinline muted></video>\n      <p>'.concat(e.label,"</p>\n    </div>\n  ");return document.createRange().createContextualFragment(t)}function s(){return e(this,void 0,void 0,function(){var e,n,i;return t(this,function(t){switch(t.label){case 0:return r?(r.innerHTML="",[4,navigator.mediaDevices.getUserMedia({audio:!1,video:!0})]):[2];case 1:return t.sent(),console.log("initial stream"),[4,c()];case 2:return e=t.sent(),n=e.map(function(e){return navigator.mediaDevices.getUserMedia({audio:!1,video:{deviceId:{exact:e.deviceId}}})}),[4,Promise.all(n).catch(console.error)];case 3:return i=t.sent(),console.log({streams:i}),e.map(u).forEach(function(e){return r.append(e)}),r.querySelectorAll("video").forEach(function(e,t){e.srcObject=i[t]}),[2]}})})}null==o||o.addEventListener("click",s),null==r||r.addEventListener("click",function(e){if(e.target instanceof HTMLVideoElement){var t=e.target;"requestPictureInPicture"in e.target&&t.requestPictureInPicture(),"webkitSupportsPresentationMode"in t&&t.webkitSetPresentationMode("picture-in-picture"===t.webkitPresentationMode?"inline":"picture-in-picture")}}),s();
},{"./errorMessages":"K1T5"}]},{},["JGqJ"], null)
//# sourceMappingURL=/scripts.deb5c40c.js.map
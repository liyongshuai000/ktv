
import App from './App'
Vue.prototype.errorLoadImg = function(event) {
    event.target.src = '../../../static/img/default-img.png';
};
/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App }
})

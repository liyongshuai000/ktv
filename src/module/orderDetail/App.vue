<template>
  <div id="app">
    <div style='width: 100%;height: 100%;'>
  	<staff-info></staff-info>
    <div class="weui-flex nore-order op-btn" v-if='order.ostate_id===1' style="z-index: 10010;">
      <div class="weui-flex-item order-time color-9"><i class="time-icon"></i>{{nowTime-order.create_time|countDownFilter}}</div>
      <div class="weui-flex-item reminder blue-bg"  @touchstart='feedback(3,"催单")'>催单</div>
      <div class="weui-flex-item cancle-order gray-bg" @touchstart='cancelOrder'>取消预约</div>
    </div>
    <div class="weui-flex re-order op-btn" v-if='order.ostate_id===2' style="z-index: 10010;">
      <div class="weui-flex-item order-time color-9"><i class="time-icon"></i>{{nowTime-order.create_time|countDownFilter}}</div>
      <div class="weui-flex-item reminder blue-bg" @touchstart='comfeed'>投诉</div>
      <div class="weui-flex-item cancle-order gray-bg" @touchstart='cancelOrder'>取消预约</div>
    </div>
    <div class="op-btn gray-bg" v-if='order.ostate_id===4' style="z-index: 10010;">
      已取消
    </div>
    <div class="weui-flex complete-order op-btn" v-if='order.ostate_id===3' style="z-index: 10010;">
        <div class="weui-flex-item reminder blue-bg" @touchstart='payment' v-if='order.online_pay===1'>立即支付</div>
        <div class="weui-flex-item green-bg">
          <a :href='`review.html?employee_id=${order.employee_id}&order_id=${order.order_id}`' style="color: #fff;">打赏</a>
        </div>
    </div>
    <div class="op-btn gray-bg" v-if='order.ostate_id===5' style="z-index: 10010;"> 
      已付款,待评价
    </div>
    <div class="op-btn gray-bg" v-if='order.ostate_id===4' style="z-index: 10010;">
      已完成
    </div>
    <complain ref='complain' @comment='feed'></complain>
    <pay-for ref='payfor' @payType='payfor'></pay-for>
  </div>
</div>
</template>

<script type="text/ecmascript-6">
  import staffInfo  from '../../component/staffInfo';
  import payFor from '../../component/payfor';
  import complain from '../../component/complain';
  export default {
    name: 'app',
    data(){
    	return {
        nowTime: 0,
        query: {},
        order: {}
    	}
    },
    filters:{
      countDownFilter
    },
    components:{
      payFor,staffInfo,complain
    },
    methods: {
      orderDetail(){
        let params = {
          token: getCookie('token'),
          order_id: this.query.order_id 
        }
        $.ajax({
          url: `${baseAjax}/order/orderDetail.jhtml`,
          type: 'GET',
          dataType: 'json',
          data: params,
          success: res=>{
            let {code,data,desc} =res;
            if (code===0) {
              this.order=data;
            }else{
              error(code,desc)
            }
          }
        });
      },
      payment(){
        this.$refs.payfor.maskBol = true;
      },
      payfor(payParams){
        let {order_amount,optype} =payParams;
        let params ={
          token: getCookie('token'),
          optype: optype,
          order_id: this.order.order_id,
          order_amount: order_amount,
          optarget: 1
        }
        $.ajax({
          url: `${baseAjax}/pay/pay.jhtml`,
          type: 'POST',
          dataType: 'json',
          data: params,
          success: res=>{
            let {code,data,desc} =res;
            if (code===0) {
              if (optype==1) {
                WeixinJSBridge.invoke('getBrandWCPayRequest',{
                  "appId":data.payParams.appId,
                  "nonceStr":data.payParams.nonceStr,
                  "package":data.payParams.packageName,
                  "signType":data.payParams.signType,
                  "timeStamp":data.payParams.timeStamp,
                  "paySign":data.payParams.paySign
                }, function(res){
                  // WeixinJSBridge.log(res.err_msg);
                  // alert(res.err_code+res.err_desc+res.err_msg);
                  window.location.href = 'userOrder.html';
                });
              }else if (optype==2) {
                let cashpay = {
                    token: getCookie('token'),
                    pay_sn: data.payParams.pay_sn
                }
                $.ajax({
                    url: `${payforAjax}/web/inner.jhtml`,
                    type: 'POST',
                    dataType: 'json',
                    data: cashpay,
                    success: res=>{
                        let {code,desc} =res;
                        if (code===0) {
                            window.location.href = 'userOrder.html';
                        }else{
                            error(code,desc)
                        }
                    }
                });
              }
            }else{
              error(code,desc)
            }
          }
        });
      },
      cancelOrder(){
        $.confirm('', '确认取消预约？', ()=>{
          let params = {
              token: getCookie('token'),
              order_id: this.order.order_id
          }
          $.ajax({
              url: `${baseAjax}/order/cancelOrder.jhtml`,
              type: 'POST',
              dataType: 'json',
              data: params,
              success: res=>{
                  let {code,data,desc} =res;
                  if (code===0) {
                    this.orderDetail();
                  }else{
                    $.alert('',desc);
                  }
              }
          });
        }, ()=>{
            return false;
        });
      },
      comfeed(){
        this.$refs.complain.maskBol = true;
      },
      feed(note){
        this.feedback(2,note); 
      },
      feedback(feedback_type,note){
        let params = {
            token: getCookie('token'),
            order_id: this.order.order_id,
            comment: note,
            feedback_type: feedback_type
        }
        $.ajax({
            url: `${baseAjax}/order/feedback.jhtml`,
            type: 'POST',
            dataType: 'json',
            data: params,
            success: res=>{
                let {code,data,desc} =res;
                if (code===0) {
                    if (feedback_type==2) {
                        $.alert('',"投诉成功");
                    }else{
                        $.alert('',"系统已帮您催单，请耐心等待，谢谢！");
                    }
                }else{
                  error(code,desc)
                }
            }
        });
      } 
    },
    created(){
      this.query = getRequest();
    },
    mounted(){
        this.$nextTick(()=>{
          this.orderDetail();
          setInterval(() => {
              this.nowTime = new Date().getTime();
          }, 1000);
        })
    }
  }
</script>
<style type="text/css" lang='scss' scoped>
@import "../../common/css/mixin";
  .mood-icon{
    display: inline-block;
    width: .42rem;
    height: .42rem;
    position: absolute;
    right: .2rem;
    top: .2rem;
    z-index: 100;
    @include bg-image('../../common/img/sunny');
  }
  .time-icon{
    @include bg-image('../../common/img/time');
  }
</style>

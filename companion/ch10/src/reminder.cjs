class Reminder {
 constructor(){this.quitting=false;this.dueAt=null;this.message='尚未設定提醒';}
 closeAction(){return this.quitting?'close':'hide';}
 schedule(seconds,now=Date.now()){
  if(!Number.isInteger(seconds)||seconds<5||seconds>86400)throw Object.assign(new Error('秒數須為 5 至 86400 的整數'),{code:'VALIDATION'});
  this.dueAt=now+seconds*1000;this.message='已排定提醒（程式須持續運作）';return this.snapshot();
 }
 cancel(){this.dueAt=null;this.message='已取消提醒';return this.snapshot();}
 tick(now=Date.now()){if(this.dueAt===null||now<this.dueAt)return false;this.dueAt=null;this.message='提醒到期：請起身休息';return true;}
 quit(){this.quitting=true;this.dueAt=null;}
 snapshot(){return {dueAt:this.dueAt,message:this.message};}
}
module.exports={Reminder};

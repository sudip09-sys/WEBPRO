export class Score { private value=0; add(correct:boolean):number{if(correct)this.value++;return this.value} get total():number{return this.value} reset():void{this.value=0} }

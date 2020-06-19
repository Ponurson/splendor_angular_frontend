(window.webpackJsonp=window.webpackJsonp||[]).push([[6],{zrcO:function(e,r,t){"use strict";t.r(r),t.d(r,"UsersModule",(function(){return P}));var s=t("3Pt+"),i=t("ofXK"),n=t("tyNb"),c=t("fXoL");let b=(()=>{class e{}return e.\u0275fac=function(r){return new(r||e)},e.\u0275cmp=c.Ib({type:e,selectors:[["ng-component"]],decls:3,vars:0,consts:[[1,"p-4"],[1,"container"]],template:function(e,r){1&e&&(c.Rb(0,"div",0),c.Rb(1,"div",1),c.Pb(2,"router-outlet"),c.Qb(),c.Qb())},directives:[n.g],encapsulation:2}),e})();var o=t("SxV6"),a=t("J9tS");function d(e,r){1&e&&c.Pb(0,"span",10)}function u(e,r){1&e&&(c.Rb(0,"span"),c.rc(1,"Delete"),c.Qb())}function f(e,r){if(1&e){const e=c.Sb();c.Rb(0,"tr"),c.Rb(1,"td"),c.rc(2),c.Qb(),c.Rb(3,"td"),c.rc(4),c.Qb(),c.Rb(5,"td"),c.rc(6),c.Qb(),c.Rb(7,"td",6),c.Rb(8,"a",7),c.rc(9,"Edit"),c.Qb(),c.Rb(10,"button",8),c.Zb("click",(function(){c.kc(e);const t=r.$implicit;return c.bc().deleteUser(t.id)})),c.qc(11,d,1,0,"span",9),c.qc(12,u,2,0,"span",5),c.Qb(),c.Qb(),c.Qb()}if(2&e){const e=r.$implicit;c.Bb(2),c.sc(e.firstName),c.Bb(2),c.sc(e.lastName),c.Bb(2),c.sc(e.username),c.Bb(2),c.gc("routerLink","edit/",e.id,""),c.Bb(2),c.ec("disabled",e.isDeleting),c.Bb(1),c.ec("ngIf",e.isDeleting),c.Bb(1),c.ec("ngIf",!e.isDeleting)}}function l(e,r){1&e&&(c.Rb(0,"tr"),c.Rb(1,"td",11),c.Pb(2,"span",12),c.Qb(),c.Qb())}let m=(()=>{class e{constructor(e){this.accountService=e,this.users=null}ngOnInit(){this.accountService.getAll().pipe(Object(o.a)()).subscribe(e=>this.users=e)}deleteUser(e){this.users.find(r=>r.id===e).isDeleting=!0,this.accountService.delete(e).pipe(Object(o.a)()).subscribe(()=>{this.users=this.users.filter(r=>r.id!==e)})}}return e.\u0275fac=function(r){return new(r||e)(c.Ob(a.a))},e.\u0275cmp=c.Ib({type:e,selectors:[["ng-component"]],decls:17,vars:2,consts:[["routerLink","add",1,"btn","btn-sm","btn-success","mb-2"],[1,"table","table-striped"],[2,"width","30%"],[2,"width","10%"],[4,"ngFor","ngForOf"],[4,"ngIf"],[2,"white-space","nowrap"],[1,"btn","btn-sm","btn-primary","mr-1",3,"routerLink"],[1,"btn","btn-sm","btn-danger","btn-delete-user",3,"disabled","click"],["class","spinner-border spinner-border-sm",4,"ngIf"],[1,"spinner-border","spinner-border-sm"],["colspan","4",1,"text-center"],[1,"spinner-border","spinner-border-lg","align-center"]],template:function(e,r){1&e&&(c.Rb(0,"h1"),c.rc(1,"Users"),c.Qb(),c.Rb(2,"a",0),c.rc(3,"Add User"),c.Qb(),c.Rb(4,"table",1),c.Rb(5,"thead"),c.Rb(6,"tr"),c.Rb(7,"th",2),c.rc(8,"First Name"),c.Qb(),c.Rb(9,"th",2),c.rc(10,"Last Name"),c.Qb(),c.Rb(11,"th",2),c.rc(12,"Username"),c.Qb(),c.Pb(13,"th",3),c.Qb(),c.Qb(),c.Rb(14,"tbody"),c.qc(15,f,13,7,"tr",4),c.qc(16,l,3,0,"tr",5),c.Qb(),c.Qb()),2&e&&(c.Bb(15),c.ec("ngForOf",r.users),c.Bb(1),c.ec("ngIf",!r.users))},directives:[n.e,i.i,i.j],encapsulation:2}),e})();function p(e,r){1&e&&(c.Rb(0,"h1"),c.rc(1,"Add User"),c.Qb())}function h(e,r){1&e&&(c.Rb(0,"h1"),c.rc(1,"Edit User"),c.Qb())}function g(e,r){1&e&&(c.Rb(0,"div"),c.rc(1,"First Name is required"),c.Qb())}function v(e,r){if(1&e&&(c.Rb(0,"div",17),c.qc(1,g,2,0,"div",0),c.Qb()),2&e){const e=c.bc();c.Bb(1),c.ec("ngIf",e.f.firstName.errors.required)}}function R(e,r){1&e&&(c.Rb(0,"div"),c.rc(1,"Last Name is required"),c.Qb())}function Q(e,r){if(1&e&&(c.Rb(0,"div",17),c.qc(1,R,2,0,"div",0),c.Qb()),2&e){const e=c.bc();c.Bb(1),c.ec("ngIf",e.f.lastName.errors.required)}}function B(e,r){1&e&&(c.Rb(0,"div"),c.rc(1,"Username is required"),c.Qb())}function q(e,r){if(1&e&&(c.Rb(0,"div",17),c.qc(1,B,2,0,"div",0),c.Qb()),2&e){const e=c.bc();c.Bb(1),c.ec("ngIf",e.f.username.errors.required)}}function w(e,r){1&e&&(c.Rb(0,"em"),c.rc(1,"(Leave blank to keep the same password)"),c.Qb())}function I(e,r){1&e&&(c.Rb(0,"div"),c.rc(1,"Password is required"),c.Qb())}function N(e,r){1&e&&(c.Rb(0,"div"),c.rc(1,"Password must be at least 6 characters"),c.Qb())}function S(e,r){if(1&e&&(c.Rb(0,"div",17),c.qc(1,I,2,0,"div",0),c.qc(2,N,2,0,"div",0),c.Qb()),2&e){const e=c.bc();c.Bb(1),c.ec("ngIf",e.f.password.errors.required),c.Bb(1),c.ec("ngIf",e.f.password.errors.minlength)}}function y(e,r){1&e&&c.Pb(0,"span",18)}const k=function(e){return{"is-invalid":e}};let C=(()=>{class e{constructor(e,r,t,s,i){this.formBuilder=e,this.route=r,this.router=t,this.accountService=s,this.alertService=i,this.loading=!1,this.submitted=!1}ngOnInit(){this.id=this.route.snapshot.params.id,this.isAddMode=!this.id;const e=[s.h.minLength(6)];this.isAddMode&&e.push(s.h.required),this.form=this.formBuilder.group({firstName:["",s.h.required],lastName:["",s.h.required],username:["",s.h.required],password:["",e]}),this.isAddMode||this.accountService.getById(this.id).pipe(Object(o.a)()).subscribe(e=>{this.f.username.setValue(e.username)})}get f(){return this.form.controls}onSubmit(){this.submitted=!0,this.alertService.clear(),this.form.invalid||(this.loading=!0,this.isAddMode?this.createUser():this.updateUser())}createUser(){this.accountService.register(this.form.value).pipe(Object(o.a)()).subscribe(e=>{this.alertService.success("User added successfully",{keepAfterRouteChange:!0}),this.router.navigate([".",{relativeTo:this.route}])},e=>{this.alertService.error(e),this.loading=!1})}updateUser(){this.accountService.update(this.id,this.form.value).pipe(Object(o.a)()).subscribe(e=>{this.alertService.success("Update successful",{keepAfterRouteChange:!0}),this.router.navigate(["..",{relativeTo:this.route}])},e=>{this.alertService.error(e),this.loading=!1})}}return e.\u0275fac=function(r){return new(r||e)(c.Ob(s.b),c.Ob(n.a),c.Ob(n.c),c.Ob(a.a),c.Ob(a.b))},e.\u0275cmp=c.Ib({type:e,selectors:[["ng-component"]],decls:32,vars:22,consts:[[4,"ngIf"],[3,"formGroup","ngSubmit"],[1,"form-row"],[1,"form-group","col"],["for","firstName"],["type","text","formControlName","firstName",1,"form-control",3,"ngClass"],["class","invalid-feedback",4,"ngIf"],["for","lastName"],["type","text","formControlName","lastName",1,"form-control",3,"ngClass"],["for","username"],["type","text","formControlName","username",1,"form-control",3,"ngClass"],["for","password"],["type","password","formControlName","password",1,"form-control",3,"ngClass"],[1,"form-group"],[1,"btn","btn-primary",3,"disabled"],["class","spinner-border spinner-border-sm mr-1",4,"ngIf"],["routerLink","/users",1,"btn","btn-link"],[1,"invalid-feedback"],[1,"spinner-border","spinner-border-sm","mr-1"]],template:function(e,r){1&e&&(c.qc(0,p,2,0,"h1",0),c.qc(1,h,2,0,"h1",0),c.Rb(2,"form",1),c.Zb("ngSubmit",(function(){return r.onSubmit()})),c.Rb(3,"div",2),c.Rb(4,"div",3),c.Rb(5,"label",4),c.rc(6,"First Name"),c.Qb(),c.Pb(7,"input",5),c.qc(8,v,2,1,"div",6),c.Qb(),c.Rb(9,"div",3),c.Rb(10,"label",7),c.rc(11,"Last Name"),c.Qb(),c.Pb(12,"input",8),c.qc(13,Q,2,1,"div",6),c.Qb(),c.Qb(),c.Rb(14,"div",2),c.Rb(15,"div",3),c.Rb(16,"label",9),c.rc(17,"Username"),c.Qb(),c.Pb(18,"input",10),c.qc(19,q,2,1,"div",6),c.Qb(),c.Rb(20,"div",3),c.Rb(21,"label",11),c.rc(22," Password "),c.qc(23,w,2,0,"em",0),c.Qb(),c.Pb(24,"input",12),c.qc(25,S,3,2,"div",6),c.Qb(),c.Qb(),c.Rb(26,"div",13),c.Rb(27,"button",14),c.qc(28,y,1,0,"span",15),c.rc(29," Save "),c.Qb(),c.Rb(30,"a",16),c.rc(31,"Cancel"),c.Qb(),c.Qb(),c.Qb()),2&e&&(c.ec("ngIf",r.isAddMode),c.Bb(1),c.ec("ngIf",!r.isAddMode),c.Bb(1),c.ec("formGroup",r.form),c.Bb(5),c.ec("ngClass",c.ic(14,k,r.submitted&&r.f.firstName.errors)),c.Bb(1),c.ec("ngIf",r.submitted&&r.f.firstName.errors),c.Bb(4),c.ec("ngClass",c.ic(16,k,r.submitted&&r.f.lastName.errors)),c.Bb(1),c.ec("ngIf",r.submitted&&r.f.lastName.errors),c.Bb(5),c.ec("ngClass",c.ic(18,k,r.submitted&&r.f.username.errors)),c.Bb(1),c.ec("ngIf",r.submitted&&r.f.username.errors),c.Bb(4),c.ec("ngIf",!r.isAddMode),c.Bb(1),c.ec("ngClass",c.ic(20,k,r.submitted&&r.f.password.errors)),c.Bb(1),c.ec("ngIf",r.submitted&&r.f.password.errors),c.Bb(2),c.ec("disabled",r.loading),c.Bb(1),c.ec("ngIf",r.loading))},directives:[i.j,s.i,s.f,s.d,s.a,s.e,s.c,i.h,n.e],encapsulation:2}),e})();const O=[{path:"",component:b,children:[{path:"",component:m},{path:"add",component:C},{path:"edit/:id",component:C}]}];let U=(()=>{class e{}return e.\u0275mod=c.Mb({type:e}),e.\u0275inj=c.Lb({factory:function(r){return new(r||e)},imports:[[n.f.forChild(O)],n.f]}),e})(),P=(()=>{class e{}return e.\u0275mod=c.Mb({type:e}),e.\u0275inj=c.Lb({factory:function(r){return new(r||e)},imports:[[i.b,s.g,U]]}),e})()}}]);
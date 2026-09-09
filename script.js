const KEY="caringShadesBookings";
const $=id=>document.getElementById(id);
const money=n=>"$"+Number(n||0).toFixed(2).replace(".00","");
function getBookings(){return JSON.parse(localStorage.getItem(KEY)||"[]")}
function saveBookings(b){localStorage.setItem(KEY,JSON.stringify(b))}
function calc(){
 const s=$("service").value, date=$("date").value, start=$("start").value, end=$("end").value;
 let total=0;
 if(s==="Hourly" && start && end){
   let a=start.split(":").map(Number), b=end.split(":").map(Number);
   let h=(b[0]*60+b[1]-(a[0]*60+a[1]))/60;
   if(h>0) total=Math.max(1,h)*4;
 } else if(s==="Daily") total=17;
 else if(s==="Night") total=25;
 $("estimate").textContent=money(total);
}
["service","date","start","end"].forEach(x=>$(x).addEventListener("change",calc));
$("date").min=new Date().toISOString().split("T")[0];

$("bookingForm").addEventListener("submit",e=>{
 e.preventDefault(); calc();
 const ref="CS-"+Date.now().toString().slice(-8);
 const b={
  ref, service:$("service").value,date:$("date").value,start:$("start").value,end:$("end").value,
  children:$("children").value,ages:$("ages").value,name:$("name").value,phone:$("phone").value,
  email:$("email").value,emergency:$("emergency").value,location:$("location").value,
  special:$("special").value,notes:$("notes").value,estimate:$("estimate").textContent,status:"Pending",
  created:new Date().toISOString()
 };
 const list=getBookings(); list.unshift(b); saveBookings(list);
 $("ref").textContent=ref; $("success").classList.remove("hidden"); e.target.reset(); $("estimate").textContent="$0";
});
function closeSuccess(){$("success").classList.add("hidden")}
function showAdmin(){document.getElementById("mainSite").classList.add("hidden");document.getElementById("adminPanel").classList.remove("hidden");renderAdmin();window.scrollTo(0,0)}
function hideAdmin(){document.getElementById("adminPanel").classList.add("hidden");document.getElementById("mainSite").classList.remove("hidden");window.scrollTo(0,0)}
function renderAdmin(){
 const b=getBookings(), now=new Date();
 $("total").textContent=b.length; $("pending").textContent=b.filter(x=>x.status==="Pending").length;
 $("confirmed").textContent=b.filter(x=>x.status==="Confirmed").length;
 $("upcoming").textContent=b.filter(x=>new Date(x.date+"T"+(x.start||"00:00"))>=now).length;
 $("bookingList").innerHTML=b.length?b.map((x,i)=>`
 <div class="booking-item"><div class="booking-top"><div><strong>${x.ref}</strong><h3>${x.name} — ${x.service}</h3><p>${x.date} ${x.start||""}${x.end?"–"+x.end:""} · ${x.children} child(ren) · ${x.location}</p></div><span class="status">${x.status}</span></div>
 <p><b>Phone:</b> ${x.phone} &nbsp; <b>Email:</b> ${x.email}<br><b>Ages:</b> ${x.ages} &nbsp; <b>Estimated:</b> ${x.estimate}</p>
 ${x.special?`<p><b>Special requirements:</b> ${x.special}</p>`:""}${x.notes?`<p><b>Notes:</b> ${x.notes}</p>`:""}
 <div class="booking-actions"><button onclick="setStatus(${i},'Confirmed')">Confirm</button><button onclick="setStatus(${i},'Declined')">Decline</button><button onclick="setStatus(${i},'Pending')">Set Pending</button><a class="btn" style="padding:8px 12px" href="https://wa.me/${x.phone.replace(/[^0-9]/g,'')}" target="_blank">WhatsApp</a></div></div>`).join(""):"<div class='booking-item'><h3>No bookings yet</h3><p>Bookings submitted from this browser will appear here.</p></div>";
}
function setStatus(i,status){let b=getBookings();b[i].status=status;saveBookings(b);renderAdmin()}
function clearBookings(){if(confirm("Delete all bookings stored on this device?")){saveBookings([]);renderAdmin()}}
function exportBookings(){
 const b=getBookings(); const rows=[["Reference","Name","Service","Date","Start","End","Children","Ages","Phone","Email","Emergency","Location","Estimate","Status","Special","Notes"]];
 b.forEach(x=>rows.push([x.ref,x.name,x.service,x.date,x.start,x.end,x.children,x.ages,x.phone,x.email,x.emergency,x.location,x.estimate,x.status,x.special,x.notes]));
 const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="caring-shades-bookings.csv";a.click();
}
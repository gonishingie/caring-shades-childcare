const SUPABASE_URL="https://gfwtfxcwcwobduqmywlr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable__nYZ3obxkyFO70yPzoVWJg_beIGmf5U";
const { createClient } = supabase;
const db=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
const $=id=>document.getElementById(id);
const money=n=>"$"+Number(n||0).toFixed(2).replace(".00","");
let adminBookings=[];

function calc(){
 const s=$("service").value, start=$("start").value, end=$("end").value;
 let total=0;
 if(s==="Hourly" && start && end){
   const a=start.split(":").map(Number), b=end.split(":").map(Number);
   const h=(b[0]*60+b[1]-(a[0]*60+a[1]))/60;
   if(h>0) total=Math.max(1,h)*4;
 } else if(s==="Daily") total=17;
 else if(s==="Night") total=25;
 $("estimate").textContent=money(total);
}
["service","date","start","end"].forEach(x=>$(x).addEventListener("change",calc));
$("date").min=new Date().toISOString().split("T")[0];

$("bookingForm").addEventListener("submit",async e=>{
 e.preventDefault();
 calc();
 const ref="CS-"+Date.now().toString().slice(-8);
 const row={
  booking_reference:ref,
  service:$("service").value,
  booking_date:$("date").value,
  start_date:$("date").value,
  end_date:$("date").value,
  start_time:$("start").value,
  end_time:$("end").value||null,
  number_of_children:Number($("children").value),
  children_ages:$("ages").value,
  parent_name:$("name").value,
  phone:$("phone").value,
  email:$("email").value,
  emergency_contact:$("emergency").value,
  location:$("location").value,
  special_requirements:$("special").value,
  notes:$("notes").value,
  estimated_price:Number($("estimate").textContent.replace("$","")),
  status:"Pending"
 };
 const {error}=await db.from("bookings").insert(row);
 if(error){
   console.error(error);
   alert("We could not submit the booking right now. Please try again or contact Caring Shades on WhatsApp.");
   return;
 }
 $("ref").textContent=ref;
 $("success").classList.remove("hidden");
 e.target.reset();
 $("estimate").textContent="$0";
});

function closeSuccess(){$("success").classList.add("hidden")}

async function showAdmin(){
 const {data:{session}}=await db.auth.getSession();
 if(!session){
   const email=prompt("Admin email:");
   if(!email)return;
   const password=prompt("Admin password:");
   if(!password)return;
   const {error}=await db.auth.signInWithPassword({email,password});
   if(error){alert("Admin sign-in failed. Please check the email and password.");return;}
 }
 document.getElementById("mainSite").classList.add("hidden");
 document.getElementById("adminPanel").classList.remove("hidden");
 await renderAdmin();
 window.scrollTo(0,0);
}
async function hideAdmin(){
 document.getElementById("adminPanel").classList.add("hidden");
 document.getElementById("mainSite").classList.remove("hidden");
 window.scrollTo(0,0);
}

async function renderAdmin(){
 const {data:{session}}=await db.auth.getSession();
 if(!session){hideAdmin();return;}
 const {data:b,error}=await db.from("bookings").select("*").order("created_at",{ascending:false});
 if(error){alert("Could not load bookings. Please check the Supabase admin policy.");console.error(error);return;}
 adminBookings=b||[];
 const now=new Date();
 $("total").textContent=adminBookings.length;
 $("pending").textContent=adminBookings.filter(x=>x.status==="Pending").length;
 $("confirmed").textContent=adminBookings.filter(x=>x.status==="Confirmed").length;
 $("upcoming").textContent=adminBookings.filter(x=>new Date((x.start_date||x.booking_date)+"T"+(x.start_time||"00:00"))>=now).length;
 $("bookingList").innerHTML=adminBookings.length?adminBookings.map((x,i)=>`
 <div class="booking-item"><div class="booking-top"><div><strong>${escapeHtml(x.booking_reference||"")}</strong><h3>${escapeHtml(x.parent_name||"")} — ${escapeHtml(x.service||"")}</h3><p>${escapeHtml(x.booking_date||x.start_date||"")} ${escapeHtml(x.start_time||"")}${x.end_time?"–"+escapeHtml(x.end_time):""} · ${escapeHtml(String(x.number_of_children||""))} child(ren) · ${escapeHtml(x.location||"")}</p></div><span class="status">${escapeHtml(x.status||"")}</span></div>
 <p><b>Phone:</b> ${escapeHtml(x.phone||"")} &nbsp; <b>Email:</b> ${escapeHtml(x.email||"")}<br><b>Ages:</b> ${escapeHtml(x.children_ages||"")} &nbsp; <b>Estimated:</b> ${money(x.estimated_price)}</p>
 ${x.special_requirements?`<p><b>Special requirements:</b> ${escapeHtml(x.special_requirements)}</p>`:""}${x.notes?`<p><b>Notes:</b> ${escapeHtml(x.notes)}</p>`:""}
 <div class="booking-actions"><button onclick="setStatus(${i},'Confirmed')">Confirm</button><button onclick="setStatus(${i},'Declined')">Decline</button><button onclick="setStatus(${i},'Pending')">Set Pending</button><a class="btn" style="padding:8px 12px" href="https://wa.me/${String(x.phone||"").replace(/[^0-9]/g,'')}" target="_blank">WhatsApp</a></div></div>`).join(""):"<div class='booking-item'><h3>No bookings yet</h3><p>Customer bookings will appear here.</p></div>";
}

async function setStatus(i,status){
 const b=adminBookings[i];
 if(!b?.id)return;
 const {error}=await db.from("bookings").update({status}).eq("id",b.id);
 if(error){alert("Status could not be updated. Please check the admin UPDATE policy.");console.error(error);return;}
 await renderAdmin();
}

async function signOutAdmin(){await db.auth.signOut();hideAdmin()}

function exportBookings(){
 const b=adminBookings;
 const rows=[["Reference","Name","Service","Booking Date","Start Date","End Date","Start","End","Children","Ages","Phone","Email","Emergency","Location","Estimate","Status","Special","Notes"]];
 b.forEach(x=>rows.push([x.booking_reference,x.parent_name,x.service,x.booking_date,x.start_date,x.end_date,x.start_time,x.end_time,x.number_of_children,x.children_ages,x.phone,x.email,x.emergency_contact,x.location,money(x.estimated_price),x.status,x.special_requirements,x.notes]));
 const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\n");
 const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="caring-shades-bookings.csv";a.click();
}

function clearBookings(){alert("For safety, bookings are now stored in the online Supabase database. Do not delete them from the website. Use the Supabase dashboard if records need to be removed.")}
function escapeHtml(value){return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]))}

const steps = ["Проект", "Оборудование", "Параметры", "Исполнители", "Журнал", "QC и примечания"];
let currentStep = 0;
const form = document.getElementById('logForm');
const nav = document.getElementById('stepNav');
const toast = document.getElementById('toast');

steps.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.className='nav-step';b.textContent=`${String(i+1).padStart(2,'0')}  ${s}`;b.onclick=()=>showStep(i);nav.appendChild(b)});

const rowTemplates = {
  sources: () => `<tr><td><input data-k="type" placeholder="Air gun / sparker"></td><td><input data-k="model" placeholder="Модель"></td><td><input data-k="serial" placeholder="S/N"></td><td><input data-k="params" placeholder="объем, давление, энергия, глубина…"></td><td><button type="button" class="del">×</button></td></tr>`,
  receivers: () => `<tr><td><input data-k="type" placeholder="DAS / гидрофоны / геофоны"></td><td><input data-k="model" placeholder="Модель"></td><td><input data-k="serial" placeholder="S/N"></td><td><input data-k="channels" placeholder="96 / 1000 м"></td><td><input data-k="spacing" placeholder="1 м / 2 м"></td><td><button type="button" class="del">×</button></td></tr>`,
  crew: () => `<tr><td><input data-k="name" placeholder="ФИО"></td><td><input data-k="role" placeholder="Оператор"></td><td><input data-k="org" placeholder="Организация"></td><td><input data-k="contact" placeholder="Телефон / позывной"></td><td><input data-k="shift" placeholder="1 / день"></td><td><button type="button" class="del">×</button></td></tr>`,
  log: () => `<tr><td><input type="date" data-k="date"></td><td><input type="text" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="HH:MM:SS" data-k="time" aria-label="Время в формате часы:минуты:секунды"></td><td><input data-k="line" placeholder="L-001"></td><td><input data-k="ffid" placeholder="1001"></td><td><input data-k="sp" placeholder="SP-001"></td><td><input data-k="x" placeholder="X / Lon"></td><td><input data-k="y" placeholder="Y / Lat"></td><td><input data-k="source" placeholder="AG-1"></td><td><input data-k="mode" placeholder="режим / энергия"></td><td><select data-k="qc"><option>OK</option><option>Повтор</option><option>Брак</option><option>Проверить</option></select></td><td><textarea data-k="comment" placeholder="Комментарий"></textarea></td><td><button type="button" class="del">×</button></td></tr>`
};
const tableMap={sources:'sourcesTable',receivers:'receiversTable',crew:'crewTable',log:'logTable'};
function applyMobileLabels(tableId,row){const table=document.getElementById(tableId);const headers=[...table.querySelectorAll('thead th')].map(th=>th.textContent.trim());[...row.children].forEach((td,i)=>{td.dataset.label=headers[i]||''});}
function normalizeLogTime(el){
  let v=String(el.value||'').trim();
  const digits=v.replace(/\D/g,'').slice(0,6);
  if (/^\d{6}$/.test(digits) && !v.includes(':')) v=`${digits.slice(0,2)}:${digits.slice(2,4)}:${digits.slice(4,6)}`;
  if (/^\d{1,2}:\d{1,2}$/.test(v)) { const [h,m]=v.split(':'); v=`${h.padStart(2,'0')}:${m.padStart(2,'0')}:00`; }
  if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(v)) { const [h,m,sec]=v.split(':'); v=`${h.padStart(2,'0')}:${m.padStart(2,'0')}:${sec.padStart(2,'0')}`; }
  el.value=v;
  const ok=!v || /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(v);
  el.setCustomValidity(ok?'':'Введите время в формате HH:MM:SS, например 14:23:07');
}
function addRow(type, data={}){const tbody=document.querySelector(`#${tableMap[type]} tbody`);tbody.insertAdjacentHTML('beforeend',rowTemplates[type]());const row=tbody.lastElementChild;applyMobileLabels(tableMap[type],row);Object.entries(data).forEach(([k,v])=>{const el=row.querySelector(`[data-k="${k}"]`);if(el)el.value=v??''}); const timeInput=row.querySelector('[data-k="time"]');if(timeInput){timeInput.addEventListener('blur',()=>normalizeLogTime(timeInput));timeInput.addEventListener('change',()=>normalizeLogTime(timeInput));} row.querySelector('.del').onclick=()=>{row.remove();updateProgress()}; row.querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('input',updateProgress));}

document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>addRow(b.dataset.add));
document.getElementById('add10Btn').onclick=()=>{for(let i=0;i<10;i++)addRow('log')};
addRow('sources'); addRow('receivers'); addRow('crew'); for(let i=0;i<5;i++)addRow('log');

function showStep(i){currentStep=Math.max(0,Math.min(steps.length-1,i));document.querySelectorAll('.step').forEach((s,idx)=>s.classList.toggle('active',idx===currentStep));document.querySelectorAll('.nav-step').forEach((b,idx)=>b.classList.toggle('active',idx===currentStep));document.getElementById('mobileStepCount').textContent=`Раздел ${currentStep+1} из ${steps.length}`;document.getElementById('mobileStepTitle').textContent=steps[currentStep];document.getElementById('bottomPrev').style.visibility=currentStep===0?'hidden':'visible';document.getElementById('bottomNext').textContent=currentStep===steps.length-1?'Экспорт XLSX':'Далее →';window.scrollTo({top:0,behavior:'smooth'});updateProgress()}
['prevBtn','bottomPrev'].forEach(id=>document.getElementById(id).onclick=()=>showStep(currentStep-1));
document.getElementById('nextBtn').onclick=()=>showStep(currentStep+1);
document.getElementById('bottomNext').onclick=()=>currentStep===steps.length-1?exportXlsx():showStep(currentStep+1);

function tableData(type){return [...document.querySelectorAll(`#${tableMap[type]} tbody tr`)].map(r=>Object.fromEntries([...r.querySelectorAll('[data-k]')].map(el=>[el.dataset.k,el.value]))).filter(o=>Object.values(o).some(v=>String(v).trim()));}
function collect(){const fd=new FormData(form);const obj={};for(const [k,v] of fd.entries()){if(k==='methods')continue;obj[k]=v}obj.methods=[...form.querySelectorAll('input[name="methods"]:checked')].map(x=>x.value);obj.sources=tableData('sources');obj.receivers=tableData('receivers');obj.crew=tableData('crew');obj.log=tableData('log');return obj}
function restore(data){for(const [k,v] of Object.entries(data)){if(['sources','receivers','crew','log','methods'].includes(k))continue;const el=form.elements[k];if(el)el.value=v??''}form.querySelectorAll('input[name="methods"]').forEach(x=>x.checked=(data.methods||[]).includes(x.value));for(const type of ['sources','receivers','crew','log']){document.querySelector(`#${tableMap[type]} tbody`).innerHTML='';(data[type]||[]).forEach(r=>addRow(type,r));if(!(data[type]||[]).length)addRow(type)}updateProgress()}

function save(){localStorage.setItem('seismicOperatorLog',JSON.stringify(collect()));showToast('Проект сохранен в браузере')}
function newLog(){
  if(!window.confirm('Создать новый журнал? Все данные текущего журнала, сохраненные на этом устройстве, будут очищены. При необходимости сначала экспортируйте текущий журнал в XLSX.')) return;
  clearTimeout(window._autoSave);
  localStorage.removeItem('seismicOperatorLog');
  form.reset();
  for(const type of ['sources','receivers','crew','log']) document.querySelector(`#${tableMap[type]} tbody`).innerHTML='';
  addRow('sources'); addRow('receivers'); addRow('crew'); for(let i=0;i<5;i++) addRow('log');
  showStep(0);
  updateProgress();
  showToast('Создан новый журнал');
}
document.getElementById('newLogBtn').onclick=newLog;

function cellText(v){
  if(v===null||v===undefined) return '';
  if(v instanceof Date){
    const y=v.getFullYear(), m=String(v.getMonth()+1).padStart(2,'0'), d=String(v.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  return String(v).trim();
}
function sheetRows(wb,name){
  const ws=wb.Sheets[name];
  if(!ws) throw new Error(`В файле отсутствует лист «${name}»`);
  return XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false,dateNF:'yyyy-mm-dd'}).map(r=>r.map(cellText));
}
function pairsToObject(rows){
  const out={};
  rows.forEach(r=>{const k=cellText(r[0]); if(k) out[k]=cellText(r[1]);});
  return out;
}
function parseMethods(value){
  const known=['2D сейсморазведка','3D сейсморазведка','DAS / ВОЛС','МОВ / МОВ-ОГТ','ВСП','Гидроакустика / профилограф'];
  const parts=String(value||'').split(',').map(x=>x.trim()).filter(Boolean);
  return {methods:parts.filter(x=>known.includes(x)),otherMethods:parts.filter(x=>!known.includes(x)).join(', ')};
}
function parseWorkbook(wb){
  const required=['Паспорт проекта','Оборудование','Параметры съемки','Исполнители','Операторский журнал'];
  required.forEach(n=>{if(!wb.Sheets[n]) throw new Error(`Это не журнал ожидаемого формата: нет листа «${n}»`)});

  const passport=pairsToObject(sheetRows(wb,'Паспорт проекта'));
  const meth=parseMethods(passport['Методы']);
  const data={
    projectName:passport['Проект']||'', projectCode:passport['Шифр проекта']||'', client:passport['Заказчик']||'', contractor:passport['Исполнитель']||'', crewNo:passport['Партия / экипаж']||'',
    dateStart:passport['Дата начала']||'', dateEnd:passport['Дата окончания']||'', area:passport['Полигон / район']||'', crs:passport['Система координат']||'', timezone:passport['Часовой пояс']||'UTC',
    methods:meth.methods, otherMethods:meth.otherMethods, recordingSystem:passport['Система регистрации']||'', navigation:passport['Навигация']||'', sync:passport['Синхронизация']||'', timeSource:passport['Источник времени']||'', equipmentNotes:passport['Примечания по конфигурации']||'',
    weather:passport['Погодные условия']||'', lineCondition:passport['Состояние линии / контакта']||'', qcCriteria:passport['Критерии QC']||'', issues:passport['Проблемы / ограничения']||'', downtime:passport['Изменения и простои']||'', finalNotes:passport['Итоговые замечания']||''
  };

  const eq=sheetRows(wb,'Оборудование').slice(1).filter(r=>r.some(v=>cellText(v)));
  data.sources=[]; data.receivers=[];
  eq.forEach(r=>{
    const cat=cellText(r[0]);
    if(cat==='Источник') data.sources.push({type:cellText(r[1]),model:cellText(r[2]),serial:cellText(r[3]),params:cellText(r[4])});
    if(cat==='Приемник') data.receivers.push({type:cellText(r[1]),model:cellText(r[2]),serial:cellText(r[3]),channels:cellText(r[4]),spacing:cellText(r[5])});
  });

  const params=pairsToObject(sheetRows(wb,'Параметры съемки').slice(1));
  Object.assign(data,{
    sampleInterval:params['Интервал дискретизации']||'',recordLength:params['Длина записи']||'',preTrigger:params['Предзапись']||'',shotInterval:params['Интервал ПВ']||'',receiverInterval:params['Шаг приемников']||'',fold:params['Номинальная кратность']||'',activeChannels:params['Активных каналов']||'',lowPass:params['ФНЧ']||'',highPass:params['ФВЧ']||'',notch:params['Notch']||'',dataFormat:params['Формат записи']||'SEG-D',amplitudeUnits:params['Единицы амплитуд']||'',geometry:params['Геометрия / расстановка']||''
  });

  const crewRows=sheetRows(wb,'Исполнители');
  data.crew=[];
  let extras=false;
  for(let i=1;i<crewRows.length;i++){
    const r=crewRows[i];
    if(!r.some(v=>cellText(v))){extras=true;continue;}
    const first=cellText(r[0]);
    if(['Ответственный за съемку','Оператор регистрации','Навигатор','HSE'].includes(first)){extras=true;continue;}
    if(!extras) data.crew.push({name:first,role:cellText(r[1]),org:cellText(r[2]),contact:cellText(r[3]),shift:cellText(r[4])});
  }
  const crewPairs=pairsToObject(crewRows);
  data.chief=crewPairs['Ответственный за съемку']||''; data.observer=crewPairs['Оператор регистрации']||''; data.navigatorName=crewPairs['Навигатор']||''; data.hse=crewPairs['HSE']||'';

  const logRows=sheetRows(wb,'Операторский журнал').slice(1).filter(r=>r.some(v=>cellText(v)));
  data.log=logRows.map(r=>({date:cellText(r[0]),time:cellText(r[1]),line:cellText(r[2]),ffid:cellText(r[3]),sp:cellText(r[4]),x:cellText(r[5]),y:cellText(r[6]),source:cellText(r[7]),mode:cellText(r[8]),qc:cellText(r[9])||'OK',comment:cellText(r[10])}));
  return data;
}
async function importXlsx(file){
  if(typeof XLSX==='undefined'){showToast('Библиотека XLSX не загрузилась. Откройте приложение один раз с интернетом.');return;}
  if(!file) return;
  try{
    const buffer=await file.arrayBuffer();
    const wb=XLSX.read(buffer,{type:'array',cellDates:true});
    const data=parseWorkbook(wb);
    if(!window.confirm(`Загрузить журнал «${data.projectName||file.name}»? Текущие данные в приложении будут заменены.`)) return;
    clearTimeout(window._autoSave);
    restore(data);
    localStorage.setItem('seismicOperatorLog',JSON.stringify(collect()));
    showStep(0);
    showToast('Журнал загружен из XLSX');
  }catch(err){
    console.error(err);
    alert(`Не удалось загрузить журнал. ${err && err.message ? err.message : 'Проверьте, что это XLSX, экспортированный этим приложением.'}`);
  }finally{
    document.getElementById('importFile').value='';
  }
}
document.getElementById('importBtn').onclick=()=>document.getElementById('importFile').click();
document.getElementById('importFile').addEventListener('change',e=>importXlsx(e.target.files&&e.target.files[0]));
document.getElementById('saveBtn').onclick=save;
const saved=localStorage.getItem('seismicOperatorLog');if(saved){try{restore(JSON.parse(saved))}catch(e){}}
form.addEventListener('input',()=>{updateProgress();clearTimeout(window._autoSave);window._autoSave=setTimeout(()=>localStorage.setItem('seismicOperatorLog',JSON.stringify(collect())),500)});

function updateProgress(){const req=[...form.querySelectorAll('[data-required]')];const filled=req.filter(el=>String(el.value).trim()).length;const methods=form.querySelectorAll('input[name="methods"]:checked').length?1:0;const total=req.length+1;const pct=Math.round(100*(filled+methods)/total);document.getElementById('progressText').textContent=pct+'%';document.getElementById('progressBar').style.width=pct+'%';document.querySelectorAll('.nav-step').forEach((b,i)=>{const sec=document.querySelector(`.step[data-step="${i}"]`);const inputs=[...sec.querySelectorAll('input,select,textarea')].filter(x=>x.type!=='button');const has=inputs.some(x=>(x.type==='checkbox'?x.checked:String(x.value).trim()));b.classList.toggle('done',has)})}
function showToast(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2000)}

const demo={client:'АО «ГеоЗаказчик»',contractor:'ООО «Полевые геофизические системы»',projectName:'Опытно-методические сейсморазведочные работы',projectCode:'SR-2026-09',crewNo:'Партия 03',dateStart:'2026-09-01',dateEnd:'2026-09-12',area:'Клязьминское водохранилище, Московская область',crs:'WGS 84 / UTM 37N',timezone:'UTC+3',methods:['2D сейсморазведка','DAS / ВОЛС'],recordingSystem:'DAS interrogator + 24-bit seismic recorder',navigation:'GNSS RTK, эхолот',sync:'GNSS PPS + аппаратный trigger',timeSource:'GNSS UTC',sampleInterval:'0.5',recordLength:'4',preTrigger:'100',shotInterval:'5',receiverInterval:'1',fold:'24',activeChannels:'96',lowPass:'800',highPass:'5',notch:'50',dataFormat:'SEG-Y',amplitudeUnits:'counts / strain rate',geometry:'Продольное профилирование. Донная коса и оптоволоконный кабель вдоль профиля; источник перемещается с шагом 5 м.',chief:'Иванов И.И.',observer:'Петров П.П.',navigatorName:'Сидоров А.А.',hse:'Орлов Д.В.',weather:'Переменная облачность, ветер 2–4 м/с, слабое волнение.',qcCriteria:'Контроль синхронизации, пропусков каналов, RMS шума и стабильности амплитуд.',sources:[{type:'Воздушная пушка',model:'Air gun 40 cu.in',serial:'AG-040',params:'40 cu.in; 120 bar; глубина 1.0 м'},{type:'Спаркер',model:'Multi-electrode sparker',serial:'SPK-01',params:'500 J; 1 имп/5 с'}],receivers:[{type:'DAS / ВОЛС',model:'Interrogator + SM fiber',serial:'DAS-01',channels:'1000 м',spacing:'gauge 2 м; dx 1 м'},{type:'Донная коса',model:'24 hydrophones',serial:'BS-24',channels:'24 канала',spacing:'2 м'}],crew:[{name:'Иванов И.И.',role:'Начальник партии',org:'Исполнитель',contact:'',shift:'день'},{name:'Петров П.П.',role:'Оператор',org:'Исполнитель',contact:'',shift:'день'}],log:[{date:'2026-09-01',time:'10:00:00',line:'KL-01',ffid:'1001',sp:'SP-001',x:'37.500100',y:'55.970100',source:'Air gun',mode:'40 cu.in / 120 bar',qc:'OK',comment:'Старт профиля'},{date:'2026-09-01',time:'10:00:05',line:'KL-01',ffid:'1002',sp:'SP-002',x:'37.500160',y:'55.970120',source:'Air gun',mode:'40 cu.in / 120 bar',qc:'OK',comment:''}]};
document.getElementById('demoBtn').onclick=()=>{restore(demo);showToast('Загружены демонстрационные данные')};

function aoaSheet(data){return XLSX.utils.aoa_to_sheet(data)}
function setWidths(ws,widths){ws['!cols']=widths.map(w=>({wch:w}))}
function exportXlsx(){if(typeof XLSX==='undefined'){showToast('Библиотека XLSX не загрузилась. Нужен интернет при первом открытии приложения.');return}const d=collect();const wb=XLSX.utils.book_new();wb.Props={Title:`Журнал оператора — ${d.projectName||'проект'}`,Subject:'Seismic operator field log',Author:d.contractor||'Field crew',CreatedDate:new Date()};
  const summary=[['ЖУРНАЛ ОПЕРАТОРА СЕЙСМОРАЗВЕДКИ',''],['Проект',d.projectName],['Шифр проекта',d.projectCode],['Заказчик',d.client],['Исполнитель',d.contractor],['Партия / экипаж',d.crewNo],['Дата начала',d.dateStart],['Дата окончания',d.dateEnd],['Полигон / район',d.area],['Методы',[...(d.methods||[]),d.otherMethods].filter(Boolean).join(', ')],['Система координат',d.crs],['Часовой пояс',d.timezone],[],['СИСТЕМЫ И СИНХРОНИЗАЦИЯ',''],['Система регистрации',d.recordingSystem],['Навигация',d.navigation],['Синхронизация',d.sync],['Источник времени',d.timeSource],['Примечания по конфигурации',d.equipmentNotes],[],['QC И УСЛОВИЯ',''],['Погодные условия',d.weather],['Состояние линии / контакта',d.lineCondition],['Критерии QC',d.qcCriteria],['Проблемы / ограничения',d.issues],['Изменения и простои',d.downtime],['Итоговые замечания',d.finalNotes]];
  let ws=aoaSheet(summary);setWidths(ws,[30,95]);ws['!merges']=[XLSX.utils.decode_range('A1:B1')];XLSX.utils.book_append_sheet(wb,ws,'Паспорт проекта');
  const eq=[['Категория','Тип','Изготовитель / модель','Серийный №','Параметры 1','Параметры 2']];d.sources.forEach(r=>eq.push(['Источник',r.type,r.model,r.serial,r.params,'']));d.receivers.forEach(r=>eq.push(['Приемник',r.type,r.model,r.serial,r.channels,r.spacing]));ws=aoaSheet(eq);setWidths(ws,[15,22,30,18,35,25]);ws['!autofilter']={ref:`A1:F${eq.length}`};XLSX.utils.book_append_sheet(wb,ws,'Оборудование');
  const params=[['Параметр','Значение','Ед. изм.'],['Интервал дискретизации',d.sampleInterval,'мс'],['Длина записи',d.recordLength,'с'],['Предзапись',d.preTrigger,'мс'],['Интервал ПВ',d.shotInterval,'м'],['Шаг приемников',d.receiverInterval,'м'],['Номинальная кратность',d.fold,''],['Активных каналов',d.activeChannels,''],['ФНЧ',d.lowPass,'Гц'],['ФВЧ',d.highPass,'Гц'],['Notch',d.notch,'Гц'],['Формат записи',d.dataFormat,''],['Единицы амплитуд',d.amplitudeUnits,''],['Геометрия / расстановка',d.geometry,'']];ws=aoaSheet(params);setWidths(ws,[30,75,12]);XLSX.utils.book_append_sheet(wb,ws,'Параметры съемки');
  const crew=[['ФИО','Должность','Организация','Контакт / позывной','Смена'],...d.crew.map(r=>[r.name,r.role,r.org,r.contact,r.shift]),[],['Ответственный за съемку',d.chief],['Оператор регистрации',d.observer],['Навигатор',d.navigatorName],['HSE',d.hse]];ws=aoaSheet(crew);setWidths(ws,[28,28,25,24,14]);XLSX.utils.book_append_sheet(wb,ws,'Исполнители');
  const log=[['Дата','Время','Профиль','FFID / запись','ПВ / SP','X / Lon','Y / Lat','Источник','Параметры / режим','QC','Комментарий'],...d.log.map(r=>[r.date,r.time,r.line,r.ffid,r.sp,r.x,r.y,r.source,r.mode,r.qc,r.comment])];ws=aoaSheet(log);setWidths(ws,[12,12,14,14,14,17,17,20,28,12,45]);ws['!autofilter']={ref:`A1:K${Math.max(1,log.length)}`};ws['!freeze']={xSplit:0,ySplit:1};XLSX.utils.book_append_sheet(wb,ws,'Операторский журнал');
  const safe=(d.projectCode||d.projectName||'seismic_log').replace(/[\\/:*?"<>|]+/g,'_').slice(0,50);XLSX.writeFile(wb,`Журнал_оператора_${safe}.xlsx`,{compression:true});showToast('XLSX сформирован')}
document.getElementById('exportBtn').onclick=exportXlsx;
showStep(0);updateProgress();

// PWA / offline support. Requires HTTPS (or localhost during development).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

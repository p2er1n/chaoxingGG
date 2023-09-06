"ui";

ui.layout(
	<vertical>
	<appbar>
	<toolbar id="title" title="超星GG"/>
	</appbar>
	<text text="帮助：" textSize="23sp"/>
	<text id="help" textSize="18sp"/>
	<horizontal>
	<text text="待刷课程" textSize="16sp"/>
	<input id="course" w="*"/>
	</horizontal>
	<horizontal>
	<checkbox id="isMute" text="静音刷课"/>
	<checkbox id="isReview" text="复习模式"/>
	</horizontal>
	<horizontal>
	<button id="start" text="开始刷课" textSize="25sp"/>
	<button id="stop" text="结束刷课" textSize="25sp"/>
	<button id="checkUpdate" text="检查更新" textSize="25sp"/>
	</horizontal>
	<text id="status" text="脚本未运行" textColor="red"/>
	<img id="ad"/>
	</vertical>
);

let version = "1.0";
ui.title.setTitle("超星GGv" + version);
let adUrl = null;
let articleUrl = "https://www.cnblogs.com/Peerin/p/17682597.html";
http.get(articleUrl,{},(res, err)=>{
    let pattern = /【广告开始】(.*)【广告结束】/;
    adUrl = res.body.string().match(pattern)[1];
});
setTimeout(function(){
    if(adUrl != null){
	ui.ad.setSource(adUrl);
    }else{
	setTimeout(arguments.callee, 500);
    }
}, 500);
let helpText = `1. 首先请确保已经开启无障碍功能！
2. 请确保已经安装了超星学习通并且已经登陆账号。
3. 请确保超星学习通目前处于退出状态或者停留在起始页面。
4. 静音刷课功能需要允许程序修改系统权限。
5. 按压音量上键可以停止刷课。
6. 蓝奏云文件夹访问密码：666
7. 脚本执行过程中，除了按压音量上键停止刷课，不要手动干涉。`;

let storage = storages.create("com.chaoxingGG.course");
let lastCourse = storage.get("lastCourse");
if(lastCourse != undefined){
    ui.course.setText(lastCourse);
}
let isMute = false;
let isReview = false;
let lastMute = storage.get("lastMute");
let lastReview = storage.get("lastReview");
let updateUrl = "https://wwya.lanzoub.com/b04wheezc";
if(lastMute != undefined){
    isMute = lastMute;
    ui.isMute.setChecked(isMute);
}
if(lastReview != undefined){
    isReview = lastReview;
    ui.isReview.setChecked(isReview);
}
let course = ui.course.text();
let s;

ui.help.setText(helpText);
ui.isMute.on("check", (checked)=>{
    if(checked)
	isMute = true;
    else
	isMute = false;
    storage.put("lastMute", isMute);
});
ui.isReview.on("check", (checked)=>{
    if(checked)
	isReview = true;
    else
	isReview = false;
    storage.put("lastReview", isReview);
});
ui.checkUpdate.click(()=>{
    http.get(articleUrl,{},(res, err)=>{
	let pattern = /【版本开始】(.*)【版本结束】/;
	latestVersion = res.body.string().match(pattern)[1];
    });    
    setTimeout(function(){
	if(latestVersion === null){
	    setTimeout(arguments.callee, 1000);
	    return;
	}
	if(latestVersion != version){
	    confirm("版本更新","当前版本：" + version + "\n最新版本：" + latestVersion + "\n访问密码是：666").then((value)=>{
		if(value){
		    app.openUrl(updateUrl);
		}
	    });
	}else{
	    alert("当前已经是最新版本！");
	}
    },1000);    
});

let latestVersion = null;
http.get(articleUrl,{},(res, err)=>{
    let pattern = /【版本开始】(.*)【版本结束】/;
    latestVersion = res.body.string().match(pattern)[1];
});
setTimeout(function(){
    if(latestVersion === null){
	setTimeout(arguments.callee, 1000);
	return;
    }
    if(latestVersion != version){
	confirm("版本更新","当前版本：" + version + "\n最新版本：" + latestVersion + "\n访问密码是：666").then((value)=>{
	    if(value){
		app.openUrl(updateUrl);
	    }
	});
    }
},1000);

ui.start.click(()=>{
    course = ui.course.text();
    if(course.length === 0){
	alert("待刷课程不能为空！");
	return;
    }

    if(!launch("com.chaoxing.mobile")){
	alert("请确认是否安装了超星学习通！");
	return;
    }

    storage.put("lastCourse", course);
    
    setScreenMetrics(2400, 1080);

    try{
	auto("normal");
    }catch(error){
	return;
    }
    
    if(isMute){
	try{
	    device.setMusicVolume(0);
	}catch(error){
	    return;	    
	}
    }
    
    s = engines.execScript("main", `let course = "${course}";let isReview = ${isReview};` + "\nstart();\n" + start.toString());
    setTimeout(function(){
	if(s.getEngine().isDestroyed()){
	    ui.status.setText("脚本未运行");
	    ui.status.setTextColor(colors.RED);
	    toastLog("脚本已经结束");
	}else{
	    ui.status.setText("脚本运行中");
	    ui.status.setTextColor(colors.GREEN);
	    setTimeout(arguments.callee, 5000);
	}
    }, 5000);
});

ui.stop.click(function(){
    if(s === undefined)
	return;

    if(s.getEngine().isDestroyed())
	return;

    toastLog("脚本即将结束");
    s.getEngine().forceStop();
});

function start(){
    while(!click("查看更多", 0)){
	if(click("跳过", 0)){
	    toastLog("检测到开屏广告并跳过");
	}
	sleep(500);
    }
    sleep(2000);
    
    for(let cnt = 1;cnt <= 10;++cnt){
	if(click("我的课程", 0))
	    break;
	else{
	    if(cnt != 10){
		toastLog("点击我的课程失败"+cnt+"次");
		sleep(2000);
	    }else{
		toastLog("无法进入我的课程，脚本退出");
		sleep(2000);
		return;
	    }
	}
    }
    sleep(2000);

    if(text("我学的课").findOnce() != null){
	for(let cnt = 1;cnt <= 10;++cnt){
	    if(click("我学的课", 0))
		break;
	    else{
		if(cnt != 10){
		    toastLog("点击我学的课失败"+cnt+"次");
		    sleep(2000);
		}else{
		    toastLog("无法进入我学的课，脚本退出");
		    sleep(2000);
		    return;
		}
	    }
	}
	sleep(2000);
    }

    while(text(course).findOnce() === null){
	scrollDown(0);
	sleep(2000);
    }
    for(let cnt = 1;cnt <= 10;++cnt){
	if(click(course, 0))
	    break;
	else{
	    if(cnt != 10){
		toastLog("点击" + course + "失败" + cnt + "次");		
		sleep(2000);
	    }else{
		toastLog("无法进入" + course + "，脚本退出");
		sleep(2000);
		return;
	    }	    
	}
    }
    sleep(2000);

    for(let cnt = 1;cnt <= 10;++cnt){
	if(click("章节", 0))
	    break;
	else{
	    if(cnt != 10){
		toastLog("点击章节失败"+cnt+"次");
		sleep(2000);
	    }else{
		toastLog("无法进入章节，脚本退出");
		sleep(2000);
		return;
	    }
	}
    }
    sleep(2000);

    //step into a task randomly
    let taskIcon = null;
    while(taskIcon === null){
	let icons = id("tv_icon").find();
	if(icons.empty()){
	    toastLog("找不到任务点，脚本退出");
	    sleep(2000);
	    return;
	}
	for(let i = 0;i < icons.length;++i){
	    let icon = icons[i];
	    if(icon.text().length > 0 || isReview){
		taskIcon = icon;
		break;
	    }
	}
	if(taskIcon == null){
	    if(text("已经到底了").findOnce() != null){
		toastLog("待刷课程已经被完成，脚本退出");
		sleep(2000);
		return;
	    }else{
		//scrollDown(0);
		swipe(450,1800,450,1000,1000);
		sleep(2000);
	    }
	}
    }
    for(let cnt = 1;cnt <= 10;++cnt){
	if(click(taskIcon.bounds().centerX() + 200, taskIcon.bounds().centerY()))
	    break;
	else{
	    if(cnt != 10){
		toastLog("进入任务点失败"+cnt+"次");	    
		sleep(2000);
	    }else{
		toastLog("无法进入任务点，脚本退出");
		sleep(2000);
		return;
	    }
	}
    }
    sleep(2000);

    //for each page
    while(true){
	//first check if this is a test task
	if(text("由此作答").findOnce() != null){
	    while(text("下一节").findOnce() == null){
		if(text("上一节").findOnce() != null){
		    //reach to the end task
		    toastLog("刷课完成！");
		    sleep(2000);
		    return;
		}
		scrollDown(0);
		sleep(2000);
	    }
	    text("下一节").findOnce().click();
	    sleep(2000);
	    if(text("下一章").findOnce() != null){
		text("下一章").findOnce().click();
		sleep(2000);
	    }
	    sleep(2000);
	}else{
	    //finish all the tasks.
	    let completedPlayIcons = [];
	    while(text("任务点").findOnce() != null || isReview){
		let playIcons = text("播放").find();
		sleep(2000);
		//if there are some videos.
		if(!playIcons.empty()){
		    playIcons.forEach((playIcon)=>{
			hasPlayed = false;
			let x = playIcon.bounds().centerX();
			let y = playIcon.bounds().centerY();
			completedPlayIcons.forEach((playIcon2)=>{
			    let x2 = playIcon2.bounds().centerX();
			    let y2 = playIcon2.bounds().centerY();
			    if(x === x2 && y === y2){
				hasPlayed = true;
				return;
			    }
			});
			if(hasPlayed)
			    return;
			playIcon.click();
			sleep(2000);
			while(true){
			    //click some comfim popups automatically
			    let widget = text("继续").findOnce();
			    if( widget != null){
				widget.click();
				sleep(2000);
			    }
			    widget = text("重试").findOnce();
			    if( widget != null){
				widget.click();
				sleep(2000);
			    }
			    let currentTimeLabel = id("land_current_time").findOnce();
			    let totalTimeLabel = id("land_total_time").findOnce();
			    if(currentTimeLabel === null || totalTimeLabel === null){
				sleep(5000);
				continue;
			    }
			    let currentTime = currentTimeLabel.text();
			    let totalTime = totalTimeLabel.text();
			    if(currentTime === totalTime && currentTime != "00:00"){
				toastLog("播放结束 -- "+ currentTime + "/" + totalTime);
				sleep(2500);
				back();
				sleep(2000);
				break;
			    }
			    sleep(2000);
			}
			completedPlayIcons.push(playIcon);
		    });
		}
		scrollDown(0);
		sleep(2000);

		if(isReview){
		    if(text("下一节").findOnce() != null || text("上一节").findOnce() != null)
			break;
		}
	    }
	    //check if it has reached to the bottom.
	    while(text("下一节").findOnce() == null){
		if(text("上一节").findOnce() != null){
		    toastLog("刷课完成！");
		    sleep(2000);
		    return;
		}
		scrollDown(0);
		sleep(2000);
	    }
	    click("下一节", 0);
	    sleep(2000);
	}
    }
}

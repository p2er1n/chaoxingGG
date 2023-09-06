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
	</horizontal>
	<button id="start" text="开始刷课！" textSize="25sp"/>
	<button id="stop" text="结束刷课" textSize="25sp"/>
	<text id="status" text="脚本未运行" textColor="red"/>
	<img id="ad"/>
	</vertical>
);

let version = "1.0";
ui.title.setTitle("超星GGv" + version);
let adUrl = "https://img1.imgtp.com/2023/09/06/KtgJCWuP.png";
ui.ad.setSource(adUrl);
let helpText = `1. 首先请确保已经开启无障碍功能！
2. 请确保已经安装了超星学习通并且已经登陆账号。
3. 请确保超星学习通目前处于退出状态或者停留在起始页面。
4. 静音刷课功能需要允许程序修改系统权限。
5. 按压音量上键可以停止刷课。`;
let storage = storages.create("com.chaoxingGG.course");
let lastCourse = storage.get("lastCourse");
if(lastCourse != undefined){
    ui.course.setText(lastCourse);
}
let isMute = false;
let lastMute = storage.get("lastMute");
if(lastMute != undefined){
    isMute = lastMute;
    ui.isMute.setChecked(isMute);
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
    
    s = engines.execScript("main", `let course = "${course}";` + "\nstart();\n" + start.toString());
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
	sleep(1000);
    }
    sleep(1000);
    
    click("我的课程", 0);
    sleep(1000);

    click("我学的课", 0);
    sleep(1000);

    click(course, 0);
    sleep(1000);

    click("章节", 0);
    sleep(1000);

    //step into a task randomly
    let icon = id("tv_icon").findOnce();
    while(icon == null){
	scrollDown(0);
	sleep(1000);
	icon = id("tv_icon").findOnce();
    }
    click(icon.bounds().centerX() + 200, icon.bounds().centerY());
    sleep(1000);

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
		sleep(1000);
	    }
	    text("下一节").findOnce().click();
	    sleep(1000);
	    if(text("下一章").findOnce() != null){
		text("下一章").findOnce().click();
		sleep(1000);
	    }
	    sleep(1000);
	}else{
	    //finish all the tasks.
	    let completedPlayIcons = [];
	    while(text("任务点").findOnce() != null){
		let playIcons = text("播放").find();
		sleep(1000);
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
			sleep(1000);
			while(true){
			    //click some comfim popups automatically
			    let widget = text("继续").findOnce();
			    if( widget != null){
				widget.click();
				sleep(1000);
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
				sleep(1000);
				break;
			    }
			    sleep(5000);
			}
			completedPlayIcons.push(playIcon);
		    });
		}
		scrollDown(0);
		sleep(1000);
	    }
	    //check if it has reached to the bottom.
	    while(text("下一节").findOnce() == null){
		if(text("上一节").findOnce() != null){
		    toastLog("刷课完成！");
		    sleep(2000);
		    return;
		}
		scrollDown(0);
		sleep(1000);
	    }
	    click("下一节", 0);
	    sleep(2000);
	}
    }
}

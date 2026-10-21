# StupidRun

校园跑和俱乐部的手机应用。跑步规则、轨迹生成、登录和俱乐部接口沿用原来的 byerun 逻辑，界面用 Expo 做成 Android 应用。

## 功能

底部有三个页面。

**校园跑**

- 用手机号和密码登录，登录状态会保存在本机。刷新用户信息时继续用当前 token，不会因为接口没再带回 token 就把人退出。
- 查看本学期已跑公里、要求和完成次数。
- 填写距离和时间，选择校园路线，按学期标准生成轨迹并提交跑步。
- 选过的路线会记成默认路线，之后一直用它，除非手动再改。
- 「记录」是跑步页里的二级页面，查看最近的跑步记录。

**俱乐部**

- 按日期查看活动列表，报名或取消报名。状态按每一场活动单独显示，不会把一场的报名套到所有场次上。
- 「我的任务」查看已报名的活动。
- 签到、签退只出现在当前这一场上。没签到显示「签到」，签到之后显示「签退」，签到和签退都完成则不再显示按钮。
- 签到坐标用的是这场活动场地的经纬度，来自签到状态接口或活动列表，不读取手机定位。
- 可以查看签到记录和学期记录。

**我的**

- 查看姓名、手机、学号和学校。
- 退出登录。

## 本地运行

```bash
npm install
npx expo start
```

Android 模拟器或 Expo Go 都可以打开。模拟器里的 Expo Go 图标仍是 Expo 自己的。

## 打包 APK

本机需要 JDK 21 和 Android SDK。在项目目录执行：

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

安装包在 `android/app/build/outputs/apk/release/app-release.apk`。桌面图标和启动图使用应用封面。这个包是调试签名，可以安装使用，不适合上架。

## 测试

```bash
npm test
```

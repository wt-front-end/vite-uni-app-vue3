<template>
  <div id="MAps" style="width: 100vw; height: 100vh; pointer-events: auto"></div>
  <div fixed top-25 left-5 flex flex-col>
    <div v-for="(cr, key) of color" :key="key" flex-center class="text-sm" :style="{ color: cr }">
      <img :src="`https://hltm.jw.linan.gov.cn/linanjiwei/jsjw/img/${key}.png`" w-3 h-4 m-1 mb-1 />
      {{ key }}
    </div>
  </div>
  <div fixed bottom-16 right-5 flex flex-col>
    <uni-icons
      type="settings-filled"
      bg="light-50"
      :size="app.Global.FontSizeNum == 16 ? 25 : 40"
      shadow-xl
      p-1
      rounded-100
      color="#666"
      @click="showLine"
    ></uni-icons>
    <uni-icons
      type="navigate-filled"
      bg="light-50"
      :size="app.Global.FontSizeNum == 16 ? 25 : 40"
      shadow-xl
      p-1
      my-2
      rounded-100
      color="#666"
      @click="location"
    ></uni-icons>
    <uni-icons
      :size="app.Global.FontSizeNum == 16 ? 25 : 40"
      type="reload"
      color="#666"
      bg="light-50"
      shadow-xl
      p-1
      rounded-100
      @click="reset"
    ></uni-icons>
  </div>
  <uni-popup ref="popup" background-color="#0000" @change="change">
    <uni-card :is-shadow="true">
      <template #title>
        <view flex flex-col>
          <view flex>
            <img
              :src="
                item.fileUrl || '//store.is.autonavi.com/showpic/cf623a546cdbcf6c8cfc35c392106283'
              "
              w-10
              h-10
              m-2
              mb-1
            />
            <view flex flex-col mx-2 mt-2 w-full>
              <view font-900 class="text-base" flex-center justify="between">
                <text @click="handleGo(item)">{{ item.name }}</text>
                <uni-icons
                  type="closeempty"
                  self=""
                  size="18"
                  color="#666"
                  @click="close"
                ></uni-icons>
              </view>
              <view>
                <uni-tag :text="item.line" type="error" size="small"></uni-tag>
              </view>
            </view>
          </view>
          <view flex color="#666" font-200>
            <uni-icons type="location" size="18" color="#666"></uni-icons>
            {{ item.address }} | {{ distance || '-' }}??????
          </view>
        </view>
      </template>
      <view class="text-cut-2 text-sm" @click="handleGo(item)">
        {{ item.intro }}
      </view>
      <view flex color="#3089FF" mt-2>
        <view v-if="item.phone" flex-center @click="PhoneCall(item.phone)">
          <uni-icons
            type="phone-filled"
            :size="app.Global.FontSizeNum == 16 ? 18 : 22"
            color="#3089FF"
          ></uni-icons>
          <text class="text-base mx-0.5">??????</text>
        </view>
        <view v-if="app.Global.GetTicketId == ''" flex-center mx-6 @click="openPopup(item)">
          <uni-icons
            type="navigate-filled"
            :size="app.Global.FontSizeNum == 16 ? 18 : 22"
            color="#3089FF"
          ></uni-icons>
          <text class="text-base mx-0.5">??????</text>
        </view>
        <view flex-center @click="handleGo(item)">
          <uni-icons
            type="bars"
            :size="app.Global.FontSizeNum == 16 ? 18 : 22"
            color="#3089FF"
          ></uni-icons>
          <text class="text-base mx-0.5">????????????</text>
        </view>
      </view>
    </uni-card>
    <view w-full h-4></view>
    <SelectMap ref="selectMapPopup" :lnglat="lnglat" :addr="addr" />
  </uni-popup>
</template>

<script setup name="Map">
import $api from '@/api'
import SelectMap from '@/components/SelectMap'
import MapLoader from '@/utils/map.js'

let MAps = null
let district = null
let item = ref({})
let popup = ref(null)
function PhoneCall(num) {
  if (!num) {
    return uni.showToast({
      icon: 'none',
      title: '??????????????????',
    })
  }
  /* eslint handle-callback-err: "warn" */
  ZWJSBridge.onReady(() => {
    console.log('???????????????????????????bridge??????')
    ZWJSBridge.phoneCall({
      corpId: num,
    })
      .then(result => {
        console.log(result)
      })
      .catch(error => {
        uni.makePhoneCall({
          phoneNumber: num,
        })
        console.log(error)
      })
  })
}
function handleGo(item) {
  app.to('/pages/culture/mapDetail', { detailId: item.id, distance: distance.value })
}
let selectMapPopup = ref(null)
let lnglat = ref([])
let addr = ref('')
function openPopup(item) {
  lnglat.value = [item.longitude, item.latitude]
  addr.value = item.address
  selectMapPopup.value.toggle()
}
function toggle() {
  popup.value.open('bottom')
}
function close() {
  popup.value.close()
}
let layer = null
let spots = []
function logMapinfo() {
  let zoom = MAps.getZoom()
  if (zoom < 10) {
    spots.map(item => item.show())
    layer.setzIndex(1)
  } else {
    spots.map(item => item.hide())
    layer.setzIndex(9999)
  }
}
let isline = ref(false)
// ????????????line
function showLine() {
  if (isline.value) {
    polyline1?.hide()
    polyline2?.hide()
    polyline3?.hide()
    polyline4?.hide()
    isline.value = false
  } else {
    getDataLine()
    isline.value = true
  }
}
function initMaps() {
  // ???????????????????????????
  MAps = new AMap.Map('MAps', {
    turboMode: false,
    showIndoorMap: false,
    defaultCursor: 'pointer',
    showBuildingBlock: false,
    showLabel: false,
    zoom: 9,
    features: ['bg', 'point'],
    center: ['120.84559', '31.09993'], // ????????????????????????
  })
  MAps.on('moveend', logMapinfo)

  layer = new AMap.LabelsLayer({
    zooms: [3, 20],
    zIndex: 3,
    collision: false,
    allowCollision: true,
  })
  MAps.add(layer)
  location()
  addBoundary('?????????', '#3493FF', '#1498FF')
  addBoundary('?????????', '#FFB41F', '#FFB41F')
  addBoundary('?????????', '#2AAE33', '#2AAE33')
}
let touristSpots = [
  {
    name: '?????????',
    position: [120.999, 30.85],
    center: [120.92, 30.85],
  },
  {
    name: '?????????',
    position: [120.768, 31.0598],
    center: [120.638, 31.0598],
  },
  {
    name: '?????????',
    position: [121.12, 31.05],
    center: [121.12, 31.15],
  },
]
let polyline1 = null
let polyline2 = null
let polyline3 = null
let polyline4 = null
// ??????line
function getDataLine() {
  $api
    .getLinePointsDetail({
      line: app.User.line,
    })
    .then(res => {
      if (res.code == 200) {
        let line1 = []
        let line2 = []
        let line3 = []
        let line4 = []
        line1 = res.data['???????????????']
        line2 = res.data['???????????????']
        line3 = res.data['???????????????']
        line4 = res.data['???????????????']
        polyline1 = new AMap.Polyline({
          path: line1,
          geodesic: true,
          lineJoin: 'round',
          showDir: true,
          dirColor: 'white',
          strokeColor: '#FF9D01',
          outlineColor: 'white',
          isOutline: true,
          strokeWeight: app.Global.FontSizeNum == 16 ? 2 : 5,
        })
        polyline2 = new AMap.Polyline({
          path: line2,
          geodesic: true,
          lineJoin: 'round',
          showDir: true,
          dirColor: 'white',
          strokeColor: '#7F2D00',
          outlineColor: 'white',
          isOutline: true,
          strokeWeight: app.Global.FontSizeNum == 16 ? 2 : 5,
        })
        polyline3 = new AMap.Polyline({
          path: line3,
          geodesic: true,
          lineJoin: 'round',
          showDir: true,
          dirColor: 'white',
          strokeColor: '#0000FF',
          outlineColor: 'white',
          isOutline: true,
          strokeWeight: app.Global.FontSizeNum == 16 ? 2 : 5,
        })
        polyline4 = new AMap.Polyline({
          path: line4,
          geodesic: true,
          lineJoin: 'round',
          showDir: true,
          dirColor: 'white',
          strokeColor: '#FF0000',
          outlineColor: 'white',
          isOutline: true,
          strokeWeight: app.Global.FontSizeNum == 16 ? 2 : 5,
        })
        MAps.add([polyline1, polyline2, polyline3, polyline4])
      }
    })
}
// ??????count
function addCountText() {
  $api
    .getMapCount({
      longitude: app.User.locationArr[0],
      latitude: app.User.locationArr[1],
      name: app.User.name,
      area: app.User.area,
      line: app.User.line,
    })
    .then(res => {
      MAps?.remove(spots)
      spots = []
      let obj = {}
      res.data.map(item => {
        obj[item.area] = item.count || 0
      })
      addText(obj)
    })
}

function getDataMap(needPoint = false) {
  addCountText()
  $api
    .getMapPoints({
      page: 1,
      size: 10000,
      longitude: app.User.locationArr[0],
      latitude: app.User.locationArr[1],
      name: app.User.name,
      area: app.User.area,
      line: app.User.line,
    })
    .then(res => {
      layer?.clear()
      addMarker(res.rows, needPoint)
    })
  if (polyline1) {
    switch (app.User.line) {
      case '???????????????':
        isline.value && polyline1?.show()
        polyline2?.hide()
        polyline3?.hide()
        polyline4?.hide()
        break
      case '???????????????':
        polyline1?.hide()
        isline.value && polyline2?.show()
        polyline3?.hide()
        polyline4?.hide()
        break
      case '???????????????':
        polyline1?.hide()
        polyline2?.hide()
        isline.value && polyline3?.show()
        polyline4?.hide()
        break
      case '???????????????':
        polyline1?.hide()
        polyline2?.hide()
        polyline3?.hide()
        isline.value && polyline4?.show()
        break
      default:
        isline.value && polyline1?.show()
        isline.value && polyline2?.show()
        isline.value && polyline3?.show()
        isline.value && polyline4?.show()
        break
    }
  }
}
let color = {
  ??????: '#4a60ff',
  ??????: '#13ba2f',
  ??????: '#b351fe',
  ??????: '#ff8617',
}
function addMarker(rows, needPoint = false) {
  let markers = []
  // ?????????????????????
  rows?.map(item => {
    let LabelsData = {
      name: item.name,
      extData: { id: item.id },
      position: [item.longitude, item.latitude],
      zooms: [10, 21],
      opacity: 1,
      zIndex: 1000,
      collision: false,
      allowCollision: true,
      icon: {
        // ????????????????????????????????? image ??????
        type: 'image',
        // ?????? url
        image: `https://hltm.jw.linan.gov.cn/linanjiwei/jsjw/img/${item.type}.png`,
        // ????????????
        size: app.Global.FontSizeNum == 16 ? [15, 18] : [20, 23],
        // ???????????? position ????????????????????? bottom-center
        anchor: 'center',
      },
      text: {
        content: item.name,
        direction: 'bottom',
        zooms: [12, 21],
        style: {
          fontSize: app.Global.FontSizeNum == 16 ? 12 : 25,
          fontWeight: 'normal',
          fillColor: color[item.type],
          strokeColor: '#fff',
          strokeWidth: app.Global.FontSizeNum == 16 ? 2 : 5,
          fold: true,
          padding: '2, 5',
        },
      },
    }
    var labelMarker = new AMap.LabelMarker(LabelsData)
    labelMarker.on('click', () => showInfoM(labelMarker))
    markers.push(labelMarker)
  })
  // ??? marker ???????????????
  layer?.add(markers)
  if (rows.length && needPoint) {
    if (app.User.area) {
      let position = touristSpots.filter(item => item.name.includes(app.User.area))
      MAps.setZoomAndCenter(10, position?.[0].position)
    } else if (app.User.name) {
      MAps.setZoomAndCenter(15, [rows[0].longitude, rows[0].latitude])
    } else {
      reset()
    }
  }
}
let distance = ref('')
function showInfoM(e) {
  MAps.setZoomAndCenter(15, e.De.position)
  $api.getPointsDetail(e.w.extData.id).then(res => {
    item.value = res.data
    item.value['fileUrl'] = res.data?.thumbnail?.url
    var p1 = app.User.locationArr
    var p2 = [res.data.longitude, res.data.latitude]
    // ?????? p1 ??? p2 ?????????????????????????????????
    var dis = AMap.GeometryUtil.distance(p1, p2)
    distance.value = p1.length ? (dis / 1000).toFixed(2) : ''
    toggle()
  })
}

function addBoundary(name = '?????????', fillColor = '#CCF3FF', strokeColor = '#CC66CC') {
  if (!district) {
    //?????????DistrictSearch
    district = new AMap.DistrictSearch({
      subdistrict: 0, //??????????????????????????????????????????
      extensions: 'all', //?????????????????????????????????????????????
      level: 'district', //????????????????????? ???
    })
  }

  district.search(name, function (status, result) {
    if (JSON.stringify(result) !== '{}') {
      // ??????????????????????????????
      var bounds = result.districtList[0].boundaries
      var polygons = []
      if (bounds) {
        for (var i = 0, l = bounds.length; i < l; i++) {
          //??????????????????polygon
          var polygon = new AMap.Polygon({
            map: MAps,
            strokeWeight: 1,
            path: bounds[i],
            fillOpacity: 0.3,
            fillColor: fillColor,
            strokeColor: strokeColor,
            strokeStyle: 'dashed',
          })
          polygons.push(polygon)
        }
      }
      // ???????????????
      // MAps.setFitView()
    }
  })
}

function addText(obj) {
  for (var i = 0; i < touristSpots.length; i += 1) {
    let marker = new AMap.Marker({
      position: touristSpots[i].position,
      extData: touristSpots[i].center,
      offset: new AMap.Pixel(-10, -10),
      clickable: true,
      bubble: true,
      anchor: 'center',
      content: `
               <div class="marker-all">
                  <div >${obj[touristSpots[i].name] || 0}
                  </div>
                   <div class="marker-title">${touristSpots[i].name}</div>
               </div>
               `,
    })
    marker.on('click', onMapClick)
    spots.push(marker)
  }
  MAps?.add(spots)
}

function onMapClick(e) {
  MAps.setZoomAndCenter(10.2, e.target.De.extData)
}

function location() {
  // ????????????
  uni.getLocation({
    type: 'wgs84',
    success: function (res) {
      console.log('????????????????????????' + res.longitude)
      console.log('????????????????????????' + res.latitude)
      app.User.addLocation([res.longitude, res.latitude])
      uni.showToast({ icon: 'none', title: '????????????????????????' })
    },
    fail: function (err) {
      console.log(err)
      uni.showToast({ icon: 'none', title: '????????????????????????' })
    },
  })
  // ???????????????
  // ZWJSBridge.onReady(() => {
  //   ZWJSBridge.getLocation()
  //     .then(result => {
  //       console.log('????????????????????????' + result.longitude)
  //       console.log('????????????????????????' + result.latitude)
  //       app.User.addLocation([result.longitude, result.latitude])
  //       uni.showToast({ icon: 'none', title: '????????????????????????' })
  //     })
  //     .catch(error => {
  //       console.log(error)
  //       uni.showToast({ icon: 'none', title: '????????????????????????' })
  //     })
  // })
  // ????????????
  // AMap.plugin('AMap.Geolocation', function () {
  //   var geolocation = new AMap.Geolocation({
  //     enableHighAccuracy: true, //????????????????????????????????????:true
  //     timeout: 10000, //??????10??????????????????????????????5s
  //     position: 'RB', //???????????????????????????
  //     offset: [20, 100], //????????????????????????????????????????????????????????????[10, 20]
  //     zoomToAccuracy: false, //?????????????????????????????????????????????????????????
  //   })
  //   geolocation.getCurrentPosition(function (status, result) {
  //     if (status == 'complete') {
  //       let position = new AMap.LngLat(120.84559, 31.09993) // ????????????
  //       app.User.addLocation([result.position.lng, result.position.lat])
  //       setTimeout(() => {
  //         MAps.setZoomAndCenter(9, position)
  //       }, 2000)
  //     } else {
  //       uni.showToast({ icon: 'none', title: '??????????????????' })
  //     }
  //   })
  //   MAps.addControl(geolocation)
  // })
}
function reset() {
  let position = new AMap.LngLat(120.84559, 31.09993) // ????????????
  MAps.setZoomAndCenter(9, position)
  addCountText()
}
onBeforeMount(() => {
  MapLoader().then(
    () => {
      getDataMap()
      nextTick(() => {
        initMaps()
      })
    },
    e => {
      console.log('??????????????????', e)
    },
  )
})
defineExpose({
  getDataMap,
})
</script>

<style lang="scss" scoped>
.icon {
  background-image: linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
}

#MAps {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}

:deep(.marker-all) {
  color: #ff8800;
  width: 2rem;
  height: 3.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  text-align: center;
  font-weight: 900;
  background: url(@/static/img/4.png) center/100% 100% no-repeat;
}

:deep(.marker-title) {
  color: #ffffff;
  font-size: 1rem;
  margin-bottom: -2rem;
  text-shadow: 0px 0px 1px rgba(0, 0, 0, 0.6);
}
</style>

<template>
  <div id="app">
    <div class="tabs">
      <!-- 탭으로 이동할 수 있는 링크 (라우팅) -->
      <router-link to="/roi-calculator" class="tab" active-class="active">ROI 계산기</router-link>
      <router-link to="/chart" class="tab" active-class="active">CHART</router-link>
      
      <!-- 데이터 업데이트 버튼, 탭과 동일한 디자인 적용 -->
      <button @click="updateData" class="tab button-tab">{{ buttonText }}</button>
    </div>

    <!-- 라우터 뷰: 각 탭의 내용이 여기에 표시됩니다. -->
    <router-view></router-view>
  </div>
</template>

<script>
import axios from 'axios'; // 데이터 업데이트 API 요청을 위해 axios 사용

export default {
  name: 'App',
  data() {
    return {
      // 버튼의 초기 문구
      buttonText: '데이터 업데이트'
    };
  },
  methods: {
    // 데이터를 업데이트하는 함수 (버튼 클릭 시 실행)
    updateData() {
      // 예시 API 호출 (실제 API 경로로 수정 필요)
      axios.get('http://localhost:8080/api/interpolation/all')
        .then(() => {
          // API 호출 성공 시 버튼 문구를 '데이터 업데이트 완료'로 변경
          this.buttonText = '데이터 업데이트 완료';

          // 5초 후 버튼 문구를 원래대로 변경
          setTimeout(() => {
            this.buttonText = '데이터 업데이트';
          }, 5000); // 5초 동안 문구 변경
        })
        .catch((error) => {
          // API 호출 실패 시 오류 로그 출력
          console.error("데이터 업데이트 중 오류 발생:", error);
        });
    }
  }
}
</script>

<style>
/* 탭을 중앙에 정렬하고 간격을 조정 */
.tabs {
  display: flex;
  justify-content: center; /* 탭을 가로로 중앙에 정렬 */
  margin-bottom: 20px;
  gap: 10px; /* 탭 사이의 간격 */
}

/* 탭 및 버튼의 기본 스타일 */
.tab {
  padding: 12px 25px;
  border: 2px solid #922712; /* 강조 색상으로 테두리 설정 */
  text-decoration: none;
  color: #922712; /* 강조 색상으로 텍스트 설정 */
  border-radius: 20px; /* 모서리를 둥글게 */
  transition: background-color 0.3s, color 0.3s; /* 부드러운 전환 효과 */
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

/* 탭 및 버튼 hover 스타일 */
.tab:hover {
  background-color: #f0e0e0; /* 강조 색상과 어울리는 부드러운 배경색 */
  color: #922712;
}

/* 활성화된 탭 스타일 */
.active {
  background-color: #922712; /* 강조 색상 */
  color: #fff; /* 선택된 탭은 흰색 텍스트로 강조 */
  font-weight: bold;
  border-color: #922712; /* 강조 색상과 동일한 테두리 */
}

/* 버튼을 탭과 동일하게 디자인 */
.button-tab {
  background-color: #383636;
  border: 2px solid #383636;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  padding: 12px 25px;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

/* 버튼 hover 스타일 */
.button-tab:hover {
  background-color: #f0e0e0;
}

/* 버튼 클릭 후 완료 상태의 스타일 (탭 활성화 스타일과 동일) */
.button-tab.completed {
  background-color: #922712;
  color: white;
}
</style>

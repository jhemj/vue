<template>
  <div class="container">
    <!-- 좌측 상단: 로고 + 전화번호 입력 -->
    <div class="box top-left">
      <div class="logo-section">
        <!-- 로고 이미지 -->
        <img src="@/assets/logo.png" alt="Logo" class="logo" />
      </div>

      <!-- 에러 메시지 표시 (전화번호 입력 후 데이터가 없거나 오류 발생 시) -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <h2>전화번호 입력</h2>
      <!-- 전화번호 입력 및 확인 버튼 -->
      <div class="input-group horizontal">
        <div class="label-container">
          <div>
            <input v-model="phoneNumber" id="phoneNumber" type="text" maxlength="15" />
          </div>
        </div>
        <div class="button-container">
          <div>
            <!-- 기존 데이터 확인 버튼 클릭 시, 데이터 조회 -->
            <button @click="fetchMemberData">기존 데이터 확인하기</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 우측 상단: 그래프 + 기존 요금제/협정가 선택 -->
    <div class="box top-right">
      <h2>그래프 및 요금제 선택</h2>

      <!-- 절감 정보를 보여주는 문구 -->
      <div v-if="sortedData.length > 0" class="savings-info">
        {{ sortedData.length }}달간 {{ formatNumber(beforeSum - afterSum) }}원의 에너지 비용을 절감할 수 있습니다.
        <br />
        3년간 {{ formatNumber((beforeSum - afterSum) * 36 / sortedData.length) }}원의 비용을 절감할 수 있습니다.
        <br />
        * 단, 12개월 이상의 요금 입력 시 예상치의 신뢰도가 높습니다.
      </div>

      <!-- 차트를 표시하는 캔버스 -->
      <canvas id="barChart" ref="barChart" class="bar-chart"></canvas>

      <!-- 요금제 및 협정가 드롭다운 -->
      <div class="calculation-group">
        <div class="dropdown-group">
          <label for="currentPlan">기존 요금제:</label>
          <!-- 요금제 선택 드롭다운 -->
          <select v-model="currentPlan" id="currentPlan">
            <option value="기업난방">기업난방</option>
            <option value="산업용-최대">산업용-최대</option>
            <option value="산업용-최소">산업용-최소</option>
          </select>
        </div>

        <div class="dropdown-group">
          <label for="discount">협정가 (Discount):</label>
          <!-- 협정가 선택 드롭다운 (10~150까지 10 단위) -->
          <select v-model="discount" id="discount">
            <option v-for="option in discountOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </div>

        <div class="button-group">
          <!-- 산출 버튼: 협정가와 요금제를 바탕으로 결과 계산 -->
          <button @click="calculateResults">산출</button>
        </div>
      </div>
    </div>

    <!-- 좌측 하단: YYYYMM + Charge 입력 -->
    <div class="box bottom-left">
      <!-- 데이터 입력 제목과 저장 버튼을 같은 줄에 배치 -->
      <div class="data-input-header">
        <h2>데이터 입력</h2>
        <!-- 저장 버튼 -->
        <button class="save-button" @click="saveMemberData">저장</button>
      </div>

      <!-- YYYYMM 및 사용요금을 입력하는 테이블 -->
      <table class="input-table">
        <thead>
          <tr>
            <th>해당년월</th>
            <th>사용요금(가스)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in memberData" :key="index">
            <!-- 해당 년월 입력 -->
            <td>
              <select v-model="row.yyyymm">
                <option v-for="month in availableMonths" :key="month" :value="month">{{ month }}</option>
              </select>
            </td>
            <!-- 사용 요금 입력 -->
            <td>
              <input v-model.number="row.charge" type="number" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 우측 하단: 예상 사용 열량(MJ) ~ 절감액 -->
    <div class="box bottom-right">
      <h2>월별 예상 절감액</h2>
      <!-- 계산 결과를 보여주는 테이블 -->
      <table class="result-table">
        <thead>
          <tr>
            <th>예상 사용 열량(MJ)</th>
            <th>LPG 전환시 요금</th>
            <th>절감액</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in memberData" :key="index">
            <!-- 예상 사용 열량 -->
            <td><input v-model="row.expectedUsageMJ" type="text" readonly /></td>
            <!-- LPG 전환 시 요금 -->
            <td><input v-model="row.lpgConversionCharge" type="text" readonly /></td>
            <!-- 절감액 -->
            <td><input v-model="row.savingAmount" type="text" readonly /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';

// Chart.js의 컴포넌트 등록 (Bar 차트 사용)
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default {
  components: { Bar }, // 차트 컴포넌트 사용
  data() {
    return {
      phoneNumber: '', // 입력한 전화번호
      errorMessage: '', // 오류 메시지
      memberData: Array(12).fill().map(() => ({
        yyyymm: '', // 사용자가 입력할 월
        charge: '', // 사용자가 입력할 요금
        actual: true
      })),
      availableMonths: [], // 선택 가능한 연월 데이터
      chartInstance: null, // 차트 인스턴스 저장
      chartOptions: {
        responsive: true, // 반응형 차트 설정
        maintainAspectRatio: false, // 차트 비율 유지하지 않음
        scales: {
          y: { beginAtZero: true } // Y축 0부터 시작
        },
        plugins: {
          legend: { display: false } // 범례 표시 안함
        }
      },
      currentPlan: '기업난방', // 기본 요금제 설정
      discount: 0, // 기본 협정가
      discountOptions: Array.from({ length: 16 }, (_, i) => (i) * 10), // 10 ~ 150까지 10 단위의 옵션
      sortedData: [], // 정렬된 데이터 저장소
      beforeSum: 0, // 기존 요금의 합계
      afterSum: 0 // LPG 전환 후 요금의 합계
    };
  },
  mounted() {
    this.generateAvailableMonths(); // 컴포넌트가 마운트되면 사용 가능한 연월을 생성
  },
  methods: {
    // 선택 가능한 연월을 생성하는 함수
    generateAvailableMonths() {
      const startYear = 2022;
      const startMonth = 7;
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;

      const months = [];
      for (let year = startYear; year <= currentYear; year++) {
        const monthStart = (year === startYear) ? startMonth : 1;
        const monthEnd = (year === currentYear) ? currentMonth : 12;
        for (let month = monthStart; month <= monthEnd; month++) {
          months.push(`${year}${String(month).padStart(2, '0')}`);
        }
      }
      this.availableMonths = months; // 연월 데이터 설정
    },

    // 회원 데이터를 서버에서 가져오는 함수
    fetchMemberData() {
      axios.get(`http://localhost:8080/api/members/${this.phoneNumber}`)
        .then(response => {
          if (response.data.length > 0) {
            // 데이터를 정렬하고 최근 12개월을 가져옴
            this.sortedData = response.data
              .sort((a, b) => b.yyyymm.localeCompare(a.yyyymm))
              .slice(0, 12);

            // 사용자 데이터로 설정
            this.memberData = Array(12).fill().map((_, index) => {
              const data = this.sortedData[index] || {};
              return {
                phoneNumber: this.phoneNumber,
                yyyymm: data.yyyymm || '',
                charge: data.charge || null,
                actual: data.actual !== undefined ? data.actual : true
              };
            });
          } else {
            this.errorMessage = '저장된 내용이 없습니다.';
            this.clearMemberData();
            this.clearErrorMessage();
          }
        })
        .catch(error => {
          this.errorMessage = error.response?.status === 404
            ? '저장된 내용이 없습니다.'
            : '데이터를 불러오는 중 오류가 발생했습니다.';
          this.clearMemberData();
          this.clearErrorMessage();
        });
    },

    // 데이터가 없을 경우 입력 필드를 초기화
    clearMemberData() {
      this.memberData = Array(12).fill().map(() => ({
        phoneNumber: this.phoneNumber,
        yyyymm: '',
        charge: null,
        actual: true
      }));
    },

    // 에러 메시지를 5초 후에 지움
    clearErrorMessage() {
      setTimeout(() => {
        this.errorMessage = '';
      }, 5000);
    },

    // 결과를 계산하고 차트를 업데이트하는 함수
    calculateResults() {
      this.saveMemberData()
        .catch((error) => {
          console.error('저장 중 오류 발생:', error);
        })
        .finally(() => {
          axios.get(`http://localhost:8080/api/expdata/${this.phoneNumber}`)
            .then(response => {
              const expData = response.data;
              this.memberData.forEach((row) => {
                const data = expData.find(item => item.yyyymm === row.yyyymm);
                if (data) {
                  // 선택된 요금제에 따라 예상 사용량을 설정
                  if (this.currentPlan === '기업난방') {
                    row.expectedUsageMJ = data.exp_MJ_heat;
                  } else if (this.currentPlan === '산업용-최대') {
                    row.expectedUsageMJ = data.exp_MJ_Ind_Max;
                  } else if (this.currentPlan === '산업용-최소') {
                    row.expectedUsageMJ = data.exp_MJ_Ind_Min;
                  }
                  // 예상 사용량과 협정가에 따른 요금 계산
                  if (row.expectedUsageMJ && data.lpgfmPrice) {
                    row.lpgConversionCharge = (row.expectedUsageMJ * (data.lpgPriceMJ - (this.discount / 50.4)) * 1.1).toFixed(1);
                  }
                  // 절감액 계산
                  if (row.charge && row.lpgConversionCharge) {
                    row.savingAmount = (row.charge - row.lpgConversionCharge).toLocaleString();
                  }
                }
              });
              this.updateChartData(); // 차트 업데이트
            })
            .catch(error => {
              console.error('예상 데이터를 불러오는 중 오류 발생:', error);
            });
        });
    },

    // 차트를 업데이트하는 함수
    updateChartData() {
      this.beforeSum = this.memberData.reduce((sum, row) => sum + (parseFloat(row.charge) || 0), 0);
      this.afterSum = this.memberData.reduce((sum, row) => sum + (parseFloat(row.lpgConversionCharge) || 0), 0);

      const ctx = this.$refs.barChart.getContext('2d');

      if (this.chartInstance) {
        this.chartInstance.destroy(); // 기존 차트 제거
      }

      this.chartInstance = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: ['Before', 'After'], // "Before"와 "After" 요금 비교
          datasets: [{
            data: [this.beforeSum, this.afterSum],
            backgroundColor: ['#767171', '#922712'] // 그래프 색상
          }]
        },
        options: {
          responsive: true,
          indexAxis: 'y', // 가로 막대 그래프 설정
          scales: {
            x: { beginAtZero: true },
            y: { beginAtZero: true }
          },
          plugins: {
            legend: { display: false } // 범례 표시 안함
          }
        }
      });
    },

    // 회원 데이터를 저장하는 함수
    saveMemberData() {
      const validMemberData = this.memberData.filter(row => row.yyyymm && row.charge);

      if (validMemberData.length === 0) {
        this.errorMessage = '유효한 데이터가 없습니다. 모든 항목을 입력해주세요.';
        this.clearErrorMessage();
        return Promise.reject('No valid data');
      }

      // 각 데이터를 순차적으로 API에 전송
      return validMemberData.reduce((promise, row) => {
        const dataToSend = {
          phoneNumber: this.phoneNumber,
          yyyymm: row.yyyymm,
          charge: row.charge,
          actual: row.actual
        };

        return promise.then(() => {
          return axios.post('http://localhost:8080/api/members', dataToSend)
            .then(response => {
              console.log('데이터 저장 성공', response);
            })
            .catch(error => {
              console.error('데이터 저장 중 에러 발생:', error);
              throw error;
            });
        });
      }, Promise.resolve());
    },

    // 숫자를 포맷팅하는 함수 (천 단위 구분)
    formatNumber(value) {
      return new Intl.NumberFormat().format(value);
    }
  }
};
</script>

<style scoped>
/* 강조 색상 */
h2, label, button {
  color: #922712;
}

/* 에러 메시지 스타일 */
.error-message {
  color: red;
  font-weight: bold;
  margin: 10px 0;
  text-align: center;
}

/* 메인 컨테이너 */
.container {
  display: grid;
  grid-template-columns: 1fr 2fr; /* 좌측은 1, 우측은 2 비율로 설정 */
  grid-template-rows: 1fr 2fr;    /* 상단은 1, 하단은 2 비율로 설정 */
  gap: 20px;
  padding: 20px;
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
}

/* 상자의 배치 설정 */
.top-left {
  grid-column: 1 / 2; /* 첫 번째 열 */
  grid-row: 1 / 2;    /* 첫 번째 행 */
}

.top-right {
  grid-column: 2 / 3; /* 두 번째 열 */
  grid-row: 1 / 2;    /* 첫 번째 행 */
}

.bottom-left {
  grid-column: 1 / 2; /* 첫 번째 열 */
  grid-row: 2 / 3;    /* 두 번째 행 (높이 2배) */
}

.bottom-right {
  grid-column: 2 / 3; /* 두 번째 열 */
  grid-row: 2 / 3;    /* 두 번째 행 (높이 2배) */
}

/* 상자의 기본 스타일 */
.box {
  border: 1px solid #ccc;
  padding: 20px;
  box-shadow: 2px 2px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* 로고 섹션 */
.logo-section {
  text-align: center;
  margin-bottom: 20px;
}

.logo {
  width: 200px;
  height: auto;
}

/* 입력 그룹 스타일 */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label-container, .button-container {
  display: flex;
  flex-direction: column;
}

input, select {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 5px;
  background-color: #922712;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #d9534f;
}

/* 테이블 스타일 */
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 5px;
  text-align: center;
  border: none;
  vertical-align: top;
  height: auto;
}

.result-table td, .result-table th {
  background-color: #ffffff;
}

/* 드롭다운과 버튼 섹션 */
.calculation-group {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.dropdown-group {
  display: flex;
  flex-direction: column;
  margin-right: 20px;
}

.button-group {
  margin-left: auto;
}

/* 그래프 스타일 */
.bar-chart {
  width: 100%;
  max-height: 250px;
}

/* 데이터 입력 박스에서 제목과 버튼을 수평 정렬 */
.data-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.save-button {
  margin-left: 20px; /* 버튼을 제목 옆에 붙임 */
}

/* 상자 내부의 요소가 위로 밀착되도록 함 */
td input, th input {
  margin: 0;
  padding: 1.5;
  line-height: 1.5;
}

/* 그래프 위에 문구를 표시하는 스타일 */
.chart-info {
  font-size: 14px;
  text-align: center;
  margin-bottom: 10px;
  color: #555;
}
</style>

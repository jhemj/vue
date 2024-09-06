<template>
  <div>
    <h2 class="highlight">최근 2년간 LNG LPG 가격비교</h2>

    <!-- 협정가 드롭다운을 우측 상단에 배치 -->
    <div style="position: absolute; top: 10px; right: 10px;">
      <label for="discount" class="highlight">협정가: </label>
      <select v-model="discount" id="discount">
        <option v-for="n in discountOptions" :key="n" :value="n">{{ n }}</option>
      </select>
    </div>
    
    <!-- chartData가 준비되었을 때만 차트를 렌더링 -->
    <LineChart v-if="chartData && chartData.labels.length > 0" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script>
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import axios from 'axios'; // 데이터 가져오기용 axios

// Chart.js에 필요한 컴포넌트 및 플러그인 등록
ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, annotationPlugin);

export default {
  name: 'ChartView',
  components: {
    LineChart: Line,
  },
  data() {
    return {
      chartData: {
        labels: [], // 차트에 표시할 날짜 레이블
        datasets: [] // LPG, LNG 가격 데이터셋
      },
      chartOptions: {
        // 차트의 기본 레이아웃 및 설정
        responsive: true,
        layout: {
          padding: {
            left: 50,
            right: 50,
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top', // 범례를 상단으로 이동
            align: 'end', // 범례를 오른쪽 끝으로 정렬
            labels: {
              fontColor: '#000'
            }
          },
          title: {
            display: true,
            text: '선물 시장을 통한 예상가격 포함',
            font: {
              size: 20
            }
          },
          // 어노테이션 플러그인을 사용하여 그래프 배경색 변경 및 텍스트 추가
          annotation: {
            annotations: {
              futureRegion: {
                type: 'box', // 특정 구간을 박스로 표시
                xMin: 24.5, // 미래 구간 시작
                xMax: 27, // 미래 구간 끝
                backgroundColor: 'rgba(200, 150, 150, 0.1)', // 파란색 배경 (투명도 0.1)
              },
              label1: {
                type: 'label',
                xValue: 25.8, // 텍스트가 표시될 X 위치
                yValue: 36, // 텍스트가 표시될 Y 위치 (center로 중간)
                content: ['미래 예상치'], // 텍스트 내용
                color: 'gray', // 텍스트 색상
                font: {
                  size: 16,
                  weight: 'bold',
                },
                backgroundColor: 'rgba(255, 255, 255, 0.5)', // 텍스트 배경색 (선택)
                position: 'center',
              },
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: '해당년월' // X축 라벨명을 '해당년월'로 변경
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: '단위가격' // Y축 라벨명을 '단위가격'으로 변경
            },
            beginAtZero: false, // 10부터 시작하기 위해 false 설정
            min: 10 // Y축 범위를 10부터 시작
          }
        }
      },
      discount: 0, // 기본 할인율
      discountOptions: Array.from({ length: 16 }, (v, k) => (k) * 10), // 10~150까지 10 단위 선택지
    };
  },
  methods: {
    // 오늘의 YYYYMM 형식을 구하는 함수
    getTodayYYYYMM() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0'); // 월을 2자리로 맞춤
      return `${year}${month}`; // 'YYYYMM' 형식으로 반환
    },
    // API에서 데이터를 가져와 차트 데이터를 업데이트하는 함수
    fetchData() {
      axios.get('http://localhost:8080/api/price') // API 호출
        .then(response => {
          const data = response.data;
          const currentDate = this.getTodayYYYYMM(); // 오늘 날짜를 YYYYMM 형식으로 가져옴

          // 데이터를 필터링하여 사용 (null 값은 0으로 처리)
          const filteredData = data.filter(item => item.yyyymm).map(item => ({
            yyyymm: item.yyyymm,
            priceMJ: item.priceMJ ?? 0,
            priceMJHeat: item.priceMJHeat ?? 0,
          }));

          // yyyymm 기준으로 데이터를 정렬
          filteredData.sort((a, b) => a.yyyymm.localeCompare(b.yyyymm));

          // 필터링된 데이터로부터 labels와 priceMJ, priceMJHeat 배열 추출
          const labels = filteredData.map(item => item.yyyymm);
          const priceMJ = filteredData.map(item => item.priceMJ);
          const priceMJHeat = filteredData.map(item => item.priceMJHeat);

          // 현재 날짜 기준 최근 24개월과 이후 4개월 데이터를 필터링
          const indexCurrent = labels.indexOf(currentDate);
          const filteredLabels = labels.slice(indexCurrent - 24, indexCurrent + 4);
          const filteredPriceMJ = priceMJ.slice(indexCurrent - 24, indexCurrent + 4);
          const filteredPriceMJHeat = priceMJHeat.slice(indexCurrent - 24, indexCurrent + 4);

          // chartData 설정, 가격 계산식을 적용하여 차트에 반영
          this.chartData = {
            labels: filteredLabels,
            datasets: [
              {
                label: 'LPG 가격 (열량당)',
                borderColor: '#922712', // 강조 색상 적용
                backgroundColor: '#922712',
                fill: false,
                data: filteredPriceMJ.map(price => (price * 1.1 - this.discount / 50.2).toFixed(2)) // 계산식 적용
              },
              {
                label: 'LNG 가격 (열량당)',
                borderColor: '#767171',
                backgroundColor: '#767171',
                fill: false,
                data: filteredPriceMJHeat.map(price => price) // LNG 데이터
              }
            ]
          };

          console.log(this.chartData); // 콘솔에서 데이터 확인
        })
        .catch(error => {
          console.error("There was an error fetching the data!", error);
        });
    }
  },
  // 할인율이 변경되면 데이터를 다시 로드
  watch: {
    discount(newVal) {
      this.fetchData();
    }
  },
  // 컴포넌트가 마운트되었을 때 데이터를 가져옴
  mounted() {
    this.fetchData();
  }
};
</script>

<style scoped>
h2 {
  text-align: center;
  margin-bottom: 20px;
}

/* 강조 색상을 적용한 스타일 */
.highlight {
  color: #922712;
}
</style>

const API = "http://165.227.68.59:8080";

var StoriApp = new Vue({
  el: "#container",
  data() {
    return {
      userId: null,
      accountId: null,
      block: "registerblock",
      user: {
        name:"",
        email:""
      },
      account: {
        user_id: "",
        owner: "",
        bank:"",
        type: "",
        number: ""
      },
      FILE: null,
      btnStatus: 'pending',
      txns: [],
    }
  },
  computed: {
    isDisabled() {
      return this.btnStatus == 'progress'
    },
  },
  async created() {
    var nextStep = "registerblock";
    let queryString = window.location.search;
    let urlParams = new URLSearchParams(queryString);
    if( urlParams.has('next') ){
      nextStep = urlParams.get('next');
      this.block = nextStep;
    }

    if( urlParams.has('account') ){
      var accountId = urlParams.get('account');
      this.accountId = accountId;
    }

    const currentUser = window.localStorage.getItem("user");
    if (currentUser) {
      this.userId = currentUser;
      this.account.user_id = currentUser;
    }

    if (nextStep == 'processblock') {
      const filesResponse= await fetch(`${API}/files/${this.accountId}`);
      const result = await filesResponse.json();
      this.txns = result.data;
    } 
  },
  methods: {
    uploadFile(e){
      this.FILE = e.target.files[0];
    },
    async submitFile(e) {
      e.preventDefault();
      
      try {
        this.btnStatus = 'progress';
        const formData = new FormData();
        formData.append('file', this.FILE, this.FILE.name);
        formData.append('account_id',this.accountId)

        const response = await axios({
          method: 'POST',
          url: `${API}/upload`,
          data: formData,
          headers: { 
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.status == 200) {
          this.btnStatus = 'success';
          window.location.href = `${window.location.origin}?next=processblock&account=${this.accountId}`;
        } else {
          this.btnStatus = 'failed';
          alert("Error al cargar el archivo")
        }
      } catch (error) {
        console.log(error);
      }
    },
    async accountSave(e) {
      e.preventDefault();

      try {
        const response = await fetch(`${API}/accounts`, {
          method: 'POST',
          body: JSON.stringify(this.account)
        });

        if (response.status == 200) {
          let result = await response.json();
          window.location.href = `${window.location.origin}?next=uploadblock&account=${result.data.account_id}`;
        } else {
          alert("Error al guardar la cuenta")
        }
      } catch (error) {
        console.error(error);
      }
    },
    async register(e) {
      e.preventDefault();

      try {
        const response = await fetch(`${API}/signup`, {
          method: 'POST',
          body: JSON.stringify(this.user)
        });

        if (response.status == 200) {
          let result = await response.json();

          window.localStorage.setItem("user", result.data.profile_id);
          window.location.href = `${window.location.origin}?next=accountblock`;
        } else {
          alert("Error al procesar el registro")
        }
      } catch (error) {
        console.error(error);
      }
    },
    async executeFile(accountId) {
      try {
        const response = await fetch(`${API}/transaction/${accountId}`);
        if (response.status == 200) {
          alert("Se ha procesado el archivo en S3, revisa el correo!")
        } else {
          alert("Error al procesar el archivo s3")
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
})
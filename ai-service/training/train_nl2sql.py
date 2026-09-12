import argparse
from datasets import load_dataset
from transformers import AutoTokenizer,AutoModelForCausalLM,TrainingArguments
from trl import SFTTrainer
from peft import LoraConfig
def main():
 p=argparse.ArgumentParser();p.add_argument('--dataset',required=True);p.add_argument('--output',default='outputs/mistral-nl2sql');p.add_argument('--base-model',default='mistralai/Mistral-7B-Instruct-v0.3');p.add_argument('--epochs',type=float,default=2);p.add_argument('--learning-rate',type=float,default=2e-5);p.add_argument('--batch-size',type=int,default=1);p.add_argument('--gradient-accumulation',type=int,default=16);a=p.parse_args()
 ds=load_dataset('json',data_files=a.dataset)['train'].map(lambda x:{'text':f"<s>[INST] Generate one SELECT only. Question: {x['question']} Schema: {x['schema']} [/INST] {x['sql']}</s>"});sp=ds.train_test_split(test_size=.1,seed=42);tok=AutoTokenizer.from_pretrained(a.base_model);tok.pad_token=tok.pad_token or tok.eos_token;model=AutoModelForCausalLM.from_pretrained(a.base_model,torch_dtype='auto',device_map='auto');peft=LoraConfig(r=16,lora_alpha=32,lora_dropout=.05,bias='none',task_type='CAUSAL_LM',target_modules=['q_proj','k_proj','v_proj','o_proj']);args=TrainingArguments(output_dir=a.output,num_train_epochs=a.epochs,learning_rate=a.learning_rate,per_device_train_batch_size=a.batch_size,gradient_accumulation_steps=a.gradient_accumulation,eval_strategy='steps',save_strategy='steps',save_steps=100,eval_steps=100,logging_steps=10,report_to='none');trainer=SFTTrainer(model=model,processing_class=tok,train_dataset=sp['train'],eval_dataset=sp['test'],args=args,peft_config=peft,dataset_text_field='text',max_seq_length=1024);trainer.train();trainer.save_model(a.output);tok.save_pretrained(a.output)
if __name__=='__main__':main()

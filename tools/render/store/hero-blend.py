# frames r00000..r(N+K-1) -> o00000..o(N-1): the first K frames blended with the K after the loop's end
import sys,os
from PIL import Image
D=sys.argv[1];K=30;fs=sorted(f for f in os.listdir(D) if f.startswith('r'));N=len(fs)-K
os.makedirs(D+'/o',exist_ok=True)
for i in range(N):
    a=Image.open(f'{D}/{fs[i]}').convert('RGB')
    if i<K: a=Image.blend(Image.open(f'{D}/{fs[N+i]}').convert('RGB'),a,i/K)
    a.save(f'{D}/o/o{i:05d}.png')
print(N)
